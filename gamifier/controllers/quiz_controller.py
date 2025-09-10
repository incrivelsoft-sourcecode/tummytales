"""
Quiz controller for the Gamifier service.
Handles quiz session management, answer submission, and completion endpoints.
"""

from flask import Blueprint, request, jsonify, g
from middleware.auth import auth_required
from services.quiz_service import start_quiz, submit_answer, complete_session, get_session_status
from services.user_data_service import get_user_profile, compute_current_week
from schemas.quiz_schema import (
    QuizStartRequest, QuizStartResponse, QuizAnswerRequest, QuizAnswerResponse,
    QuizCompleteRequest, QuizCompleteResponse, SessionStatusResponse
)
from utils.errors import LimitExceeded, NotFoundError, ValidationError, SessionTimeoutError
from utils.constants import MAX_QUIZZES_PER_DAY, QUESTIONS_PER_SESSION, POINTS_PER_CORRECT_ANSWER, DIFFICULTY_LEVELS
from config.logger import get_logger

logger = get_logger(__name__)

# Create the quiz blueprint
quiz_bp = Blueprint('quiz', __name__, url_prefix='/api/gamifier')


@quiz_bp.route('/enhanced-quiz/start', methods=['POST'])
@auth_required
def start_quiz_endpoint():
    """
    Start a new enhanced quiz session.
    
    Auth: JWT required -> g.user_id
    
    Request Body: QuizStartRequest
        {
            "difficulty": str,  # easy, medium, hard
            "week": int (optional)  # 1-52, computed if not provided
        }
    
    Returns:
        JSON response with QuizStartResponse
        - 200: Success with session created
        - 400: Invalid request parameters
        - 404: User not found or insufficient data
        - 429: Quiz limit exceeded
        - 500: Server error
    
    Response Format:
        {
            "session_id": str,
            "expires_in_seconds": int,
            "questions": [QuizQuestionView, ...]
        }
    """
    try:
        # Parse and validate request body
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        try:
            quiz_request = QuizStartRequest(**data)
        except Exception as e:
            logger.warning("Invalid quiz start request", extra={
                "extra_fields": {
                    "user_id": g.user_id,
                    "validation_error": str(e),
                    "request_data": data
                }
            })
            return jsonify({'error': f'Invalid request: {str(e)}'}), 400
        
        logger.info("Starting enhanced quiz session", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "difficulty": quiz_request.difficulty,
                "week": quiz_request.week
            }
        })
        
        # Start quiz session
        # Extract token from request for user profile service calls
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        result = start_quiz(
            user_id=g.user_id,
            difficulty=quiz_request.difficulty,
            week=quiz_request.week,
            token=token
        )
        
        # Validate and format response
        try:
            response = QuizStartResponse(**result)
            response_data = response.dict()
        except Exception as e:
            logger.error("Failed to format quiz start response", extra={
                "extra_fields": {
                    "user_id": g.user_id,
                    "result": result,
                    "error": str(e)
                }
            })
            return jsonify({'error': 'Internal server error'}), 500
        
        logger.info("Enhanced quiz session started successfully", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "session_id": response_data.get('session_id'),
                "questions_count": len(response_data.get('questions', []))
            }
        })
        
        return jsonify(response_data), 200
        
    except LimitExceeded as e:
        logger.warning("Quiz limit exceeded", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "error": str(e)
            }
        })
        return jsonify({'error': 'max_quizzes_reached'}), 429
        
    except NotFoundError as e:
        logger.warning("User or data not found for quiz start", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "error": str(e)
            }
        })
        return jsonify({'error': str(e)}), 404
        
    except ValidationError as e:
        logger.warning("Validation error starting quiz", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "error": str(e)
            }
        })
        return jsonify({'error': str(e)}), 400
        
    except Exception as e:
        logger.error("Unexpected error starting quiz", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        return jsonify({'error': 'Internal server error'}), 500


@quiz_bp.route('/enhanced-quiz/answer', methods=['POST'])
@auth_required  
def answer_quiz_endpoint():
    """
    Submit an answer for a quiz question.
    
    Auth: JWT required
    
    Request Body: QuizAnswerRequest
        {
            "session_id": str,
            "question_id": str,
            "selected_option": str  # A, B, C, D
        }
    
    Returns:
        JSON response with QuizAnswerResponse
        - 200: Success with answer processed
        - 400: Invalid request parameters
        - 404: Session or question not found
        - 408: Session timeout
        - 500: Server error
    
    Response Format:
        {
            "is_correct": bool,
            "preview_points": int,
            "retry_allowed": bool,
            "correct_answer": str (optional),
            "explanation": str (optional)
        }
    """
    answer_request = None  # Initialize to avoid "possibly unbound" errors
    try:
        # Parse and validate request body
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        try:
            answer_request = QuizAnswerRequest(**data)
        except Exception as e:
            logger.warning("Invalid quiz answer request", extra={
                "extra_fields": {
                    "user_id": g.user_id,
                    "validation_error": str(e),
                    "request_data": data
                }
            })
            return jsonify({'error': f'Invalid request: {str(e)}'}), 400
        
        logger.info("Submitting quiz answer", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "session_id": answer_request.session_id,
                "question_id": answer_request.question_id,
                "selected_option": answer_request.selected_option
            }
        })
        
        # Submit answer with timing
        import datetime
        now = datetime.datetime.utcnow()
        result = submit_answer(
            session_id=answer_request.session_id,
            question_id=answer_request.question_id,
            selected_option=answer_request.selected_option,
            started_at=now,  # Ideally this would be the session/question start time
            answered_at=now
        )
        
        # Validate and format response
        try:
            response = QuizAnswerResponse(**result)
            response_data = response.dict()
        except Exception as e:
            logger.error("Failed to format quiz answer response", extra={
                "extra_fields": {
                    "user_id": g.user_id,
                    "session_id": answer_request.session_id,
                    "result": result,
                    "error": str(e)
                }
            })
            return jsonify({'error': 'Internal server error'}), 500
        
        logger.info("Quiz answer submitted successfully", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "session_id": answer_request.session_id,
                "question_id": answer_request.question_id,
                "is_correct": response_data.get('is_correct'),
                "retry_allowed": response_data.get('retry_allowed')
            }
        })
        
        return jsonify(response_data), 200
        
    except SessionTimeoutError as e:
        session_id_for_log = answer_request.session_id if answer_request else 'unknown'
        logger.warning("Quiz session timeout", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "session_id": session_id_for_log,
                "error": str(e)
            }
        })
        return jsonify({'error': str(e)}), 408
        
    except NotFoundError as e:
        session_id_for_log = answer_request.session_id if answer_request else 'unknown'
        logger.warning("Session or question not found", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "session_id": session_id_for_log,
                "error": str(e)
            }
        })
        return jsonify({'error': str(e)}), 404
        
    except ValidationError as e:
        session_id_for_log = answer_request.session_id if answer_request else 'unknown'
        logger.warning("Validation error submitting answer", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "session_id": session_id_for_log,
                "error": str(e)
            }
        })
        return jsonify({'error': str(e)}), 400
        
    except Exception as e:
        session_id_for_log = answer_request.session_id if answer_request else 'unknown'
        logger.error("Unexpected error submitting answer", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "session_id": session_id_for_log,
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        return jsonify({'error': 'Internal server error'}), 500


@quiz_bp.route('/enhanced-quiz/complete', methods=['POST'])
@auth_required
def complete_quiz_endpoint():
    """
    Complete a quiz session and calculate final results.
    
    Auth: JWT required
    
    Request Body: QuizCompleteRequest
        {
            "session_id": str
        }
    
    Returns:
        JSON response with QuizCompleteResponse
        - 200: Success with quiz completed
        - 400: Invalid request parameters
        - 404: Session not found
        - 408: Session timeout
        - 500: Server error
    
    Response Format:
        {
            "score": int,
            "awarded_points": int,
            "badges_awarded": [str, ...]
        }
    """
    complete_request = None  # Initialize to avoid "possibly unbound" errors
    try:
        # Parse and validate request body
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        try:
            complete_request = QuizCompleteRequest(**data)
        except Exception as e:
            logger.warning("Invalid quiz complete request", extra={
                "extra_fields": {
                    "user_id": g.user_id,
                    "validation_error": str(e),
                    "request_data": data
                }
            })
            return jsonify({'error': f'Invalid request: {str(e)}'}), 400
        
        logger.info("Completing quiz session", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "session_id": complete_request.session_id
            }
        })
        
        # Complete quiz session
        result = complete_session(
            session_id=complete_request.session_id
        )
        
        # Validate and format response
        try:
            response = QuizCompleteResponse(**result)
            response_data = response.dict()
        except Exception as e:
            logger.error("Failed to format quiz complete response", extra={
                "extra_fields": {
                    "user_id": g.user_id,
                    "session_id": complete_request.session_id,
                    "result": result,
                    "error": str(e)
                }
            })
            return jsonify({'error': 'Internal server error'}), 500
        
        logger.info("Quiz session completed successfully", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "session_id": complete_request.session_id,
                "score": response_data.get('score'),
                "awarded_points": response_data.get('awarded_points'),
                "badges_count": len(response_data.get('badges_awarded', []))
            }
        })
        
        return jsonify(response_data), 200
        
    except SessionTimeoutError as e:
        session_id_for_log = complete_request.session_id if complete_request else 'unknown'
        logger.warning("Quiz session timeout on completion", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "session_id": session_id_for_log,
                "error": str(e)
            }
        })
        return jsonify({'error': str(e)}), 408
        
    except NotFoundError as e:
        session_id_for_log = complete_request.session_id if complete_request else 'unknown'
        logger.warning("Session not found for completion", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "session_id": session_id_for_log,
                "error": str(e)
            }
        })
        return jsonify({'error': str(e)}), 404
        
    except ValidationError as e:
        session_id_for_log = complete_request.session_id if complete_request else 'unknown'
        logger.warning("Validation error completing quiz", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "session_id": session_id_for_log,
                "error": str(e)
            }
        })
        return jsonify({'error': str(e)}), 400
        
    except Exception as e:
        session_id_for_log = complete_request.session_id if complete_request else 'unknown'
        logger.error("Unexpected error completing quiz", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "session_id": session_id_for_log,
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        return jsonify({'error': 'Internal server error'}), 500


@quiz_bp.route('/enhanced-quiz/config', methods=['GET'])
@auth_required
def get_quiz_config():
    """
    Get quiz configuration, difficulty levels, and current week for the authenticated user.
    
    Auth: JWT required
    
    Returns:
        JSON response with quiz constants and current week
        - 200: Success with config
        - 404: User not found
        - 500: Server error
    
    Response Format:
        {
            "current_week": int,
            "max_quizzes_per_day": int,
            "questions_per_session": int,
            "points_per_correct_answer": int,
            "difficulty_levels": [str, ...]
        }
    """
    try:
        logger.info("Getting quiz config", extra={
            "extra_fields": {
                "user_id": g.user_id
            }
        })
        
        # Get current week from user profile
        try:
            # Extract token from request for user profile service calls
            token = None
            auth_header = request.headers.get('Authorization')
            if auth_header and auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
            
            user_profile = get_user_profile(g.user_id, token)
            current_week = user_profile.get('current_week')
            
            if current_week is None:
                # Try to compute from LMP if available
                survey_data = user_profile.get('survey_data', {})
                if survey_data and "pregnancyStatus" in survey_data:
                    from services.user_data_service import extract_lmp_date
                    lmp_date = extract_lmp_date(survey_data["pregnancyStatus"])
                    if lmp_date:
                        current_week = compute_current_week(lmp_date)
                    else:
                        current_week = 1
                else:
                    current_week = 1
                    
            current_week = int(current_week) if current_week else 1
        except Exception as e:
            logger.warning("Failed to compute current week, using default", extra={
                "extra_fields": {
                    "user_id": g.user_id,
                    "error": str(e)
                }
            })
            current_week = 1
        
        response_data = {
            "current_week": current_week,
            "max_quizzes_per_day": MAX_QUIZZES_PER_DAY,
            "questions_per_session": QUESTIONS_PER_SESSION,
            "points_per_correct_answer": POINTS_PER_CORRECT_ANSWER,
            "difficulty_levels": DIFFICULTY_LEVELS
        }
        
        logger.info("Quiz config retrieved successfully", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "current_week": current_week
            }
        })
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error("Unexpected error getting quiz config", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        return jsonify({'error': 'Internal server error'}), 500


@quiz_bp.route('/enhanced-quiz/limits', methods=['GET'])
@auth_required
def get_quiz_limits():
    """
    Get current quiz limits for the authenticated user.
    
    Auth: JWT required
    
    Returns:
        JSON response with quiz limits
        - 200: Success with limits
        - 404: User not found
        - 500: Server error
    
    Response Format:
        {
            "quizzes_today": int,
            "max_quizzes_per_day": int,
            "points_today": int,
            "points_lifetime": int
        }
    """
    try:
        logger.info("Getting quiz limits", extra={
            "extra_fields": {
                "user_id": g.user_id
            }
        })
        
        # Get user game profile to check current limits
        from models.user_game_profile import UserGameProfile
        user_profile = UserGameProfile.objects(user_id=g.user_id).first()
        if not user_profile:
            logger.warning("User profile not found for limits", extra={
                "extra_fields": {
                    "user_id": g.user_id
                }
            })
            return jsonify({'error': 'User profile not found'}), 404
        
        # Refresh limits if needed (handles daily reset)
        user_profile.refresh_limits_if_needed()
        
        response_data = {
            "quizzes_today": user_profile.limits.get('quizzes_today', 0),
            "max_quizzes_per_day": MAX_QUIZZES_PER_DAY,
            "points_today": user_profile.points.get('today', 0),
            "points_lifetime": user_profile.points.get('lifetime', 0)
        }
        
        logger.info("Quiz limits retrieved successfully", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "quizzes_today": response_data['quizzes_today'],
                "max_quizzes_per_day": response_data['max_quizzes_per_day'],
                "points_today": response_data['points_today'],
                "points_lifetime": response_data['points_lifetime']
            }
        })
        
        return jsonify(response_data), 200
        
    except NotFoundError as e:
        logger.warning("User not found for limits", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "error": str(e)
            }
        })
        return jsonify({'error': str(e)}), 404
        
    except Exception as e:
        logger.error("Unexpected error getting quiz limits", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        return jsonify({'error': 'Internal server error'}), 500


@quiz_bp.route('/enhanced-quiz/status/<session_id>', methods=['GET'])
@auth_required
def get_quiz_session_status(session_id: str):
    """
    Get status of a specific quiz session.
    
    Auth: JWT required
    
    Path Parameters:
        session_id: The quiz session ID
    
    Returns:
        JSON response with SessionStatusResponse
        - 200: Success with session status
        - 404: Session not found
        - 500: Server error
    
    Response Format:
        {
            "session_id": str,
            "status": str,
            "remaining_seconds": int,
            "questions_status": [dict, ...]
        }
    """
    try:
        if not session_id or not session_id.strip():
            return jsonify({'error': 'session_id is required'}), 400
        
        logger.info("Getting quiz session status", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "session_id": session_id
            }
        })
        
        # Get session status
        result = get_session_status(
            session_id=session_id
        )
        
        # Validate and format response
        try:
            response = SessionStatusResponse(**result)
            response_data = response.dict()
        except Exception as e:
            logger.error("Failed to format session status response", extra={
                "extra_fields": {
                    "user_id": g.user_id,
                    "session_id": session_id,
                    "result": result,
                    "error": str(e)
                }
            })
            return jsonify({'error': 'Internal server error'}), 500
        
        logger.info("Quiz session status retrieved successfully", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "session_id": session_id,
                "status": response_data.get('status'),
                "remaining_seconds": response_data.get('remaining_seconds')
            }
        })
        
        return jsonify(response_data), 200
        
    except NotFoundError as e:
        logger.warning("Session not found for status", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "session_id": session_id,
                "error": str(e)
            }
        })
        return jsonify({'error': str(e)}), 404
        
    except Exception as e:
        logger.error("Unexpected error getting session status", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "session_id": session_id,
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        return jsonify({'error': 'Internal server error'}), 500
