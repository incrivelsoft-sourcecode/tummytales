"""
Flashcard controller for the Gamifier service.
Handles flashcard retrieval, flipping, and admin generation endpoints.
"""

from flask import Blueprint, request, jsonify, g
from middleware.auth import auth_required, admin_required
from services.flashcard_service import get_personalized_flashcards, flip_flashcard, admin_generate_flashcards
from services.user_data_service import compute_current_week, get_user_profile
from schemas.flashcard_schema import FlashcardResponse
from utils.errors import LimitExceeded, NotFoundError, ValidationError
from models.activity_log import log_activity, ACTIVITY_TYPES
from utils.constants import FLASHCARDS_PER_SESSION, FLASHCARD_FLIPS_PER_DAY, POINTS_PER_FLASHCARD_FLIP, FLASHCARD_FLIPS_MAX_POINTS_PER_DAY
from config.logger import get_logger

logger = get_logger(__name__)

# Create the flashcard blueprint
flashcard_bp = Blueprint('flashcard', __name__, url_prefix='/api/gamifier')


def compute_current_week_from_user(user_id: str) -> int:
    """
    Compute current pregnancy week from user profile data.
    
    Args:
        user_id: The user ID to compute week for
        
    Returns:
        int: Current pregnancy week (1-40)
        
    Raises:
        Exception: If unable to compute week
    """
    try:
        # Extract token from request for user profile service calls
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        user_profile = get_user_profile(user_id, token)
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
                
        return int(current_week) if current_week else 1
        
    except Exception as e:
        logger.warning("Failed to compute current week from user profile", extra={
            "extra_fields": {
                "user_id": user_id,
                "error": str(e)
            }
        })
        raise


@flashcard_bp.route('/flashcards', methods=['GET'])
@auth_required
def get_flashcards():
    """
    Get personalized flashcards for the authenticated user.
    
    Auth: JWT required -> g.user_id
    
    Query Parameters:
        week (int, optional): Week number (1-52). If not provided, computed from user data.
        limit (int, optional): Number of flashcards to return (default: 3)
    
    Returns:
        JSON response with list of FlashcardResponse objects
        - 200: Success with flashcards
        - 400: Invalid parameters
        - 404: User not found or insufficient data
        - 500: Server error
    
    Response Format:
        {
            "flashcards": [FlashcardResponse, ...],
            "week": int,
            "total": int
        }
    """
    try:
        # Parse query parameters
        week = request.args.get('week', type=int)
        limit = request.args.get('limit', type=int, default=3)
        
        # Validate limit parameter
        if limit < 1 or limit > 10:
            logger.warning("Invalid limit parameter", extra={
                "extra_fields": {
                    "user_id": g.user_id,
                    "limit": limit,
                    "endpoint": "/api/gamifier/flashcards"
                }
            })
            return jsonify({
                'error': 'Limit must be between 1 and 10'
            }), 400
        
        # Compute current week if not provided
        if week is None:
            try:
                week = compute_current_week(g.user_id)
                logger.debug("Computed current week", extra={
                    "extra_fields": {
                        "user_id": g.user_id,
                        "computed_week": week
                    }
                })
            except Exception as e:
                logger.error("Failed to compute current week", extra={
                    "extra_fields": {
                        "user_id": g.user_id,
                        "error": str(e)
                    }
                })
                return jsonify({
                    'error': 'Unable to determine current week'
                }), 404
        
        # Validate week parameter
        if week < 1 or week > 52:
            logger.warning("Invalid week parameter", extra={
                "extra_fields": {
                    "user_id": g.user_id,
                    "week": week,
                    "endpoint": "/api/gamifier/flashcards"
                }
            })
            return jsonify({
                'error': 'Week must be between 1 and 52'
            }), 400
        
        logger.info("Getting personalized flashcards", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "week": week,
                "limit": limit
            }
        })
        
        # Get personalized flashcards
        # Extract token from request for user profile service calls
        token = None
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
        
        flashcards = get_personalized_flashcards(g.user_id, week, limit, token)
        
        # Convert to response format
        flashcard_responses = []
        for flashcard in flashcards:
            try:
                flashcard_data = {
                    "id": str(flashcard.id),
                    "user_id": flashcard.user_id,
                    "week": flashcard.week,
                    "section": flashcard.section,
                    "difficulty": flashcard.difficulty,
                    "front_text": flashcard.front_text,
                    "back_text": flashcard.back_text,
                    "created_at": flashcard.created_at
                }
                flashcard_response = FlashcardResponse(**flashcard_data)
                flashcard_responses.append(flashcard_response.dict())
            except Exception as e:
                logger.warning("Failed to serialize flashcard", extra={
                    "extra_fields": {
                        "user_id": g.user_id,
                        "flashcard_id": str(flashcard.id),
                        "error": str(e)
                    }
                })
                continue
        
        logger.info("Successfully retrieved flashcards", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "week": week,
                "flashcards_count": len(flashcard_responses)
            }
        })
        
        return jsonify({
            "flashcards": flashcard_responses,
            "week": week,
            "total": len(flashcard_responses)
        }), 200
        
    except NotFoundError as e:
        logger.warning("User or data not found", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "error": str(e)
            }
        })
        return jsonify({'error': str(e)}), 404
        
    except ValidationError as e:
        logger.warning("Validation error", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "error": str(e)
            }
        })
        return jsonify({'error': str(e)}), 400
        
    except Exception as e:
        logger.error("Unexpected error getting flashcards", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        return jsonify({'error': 'Internal server error'}), 500


@flashcard_bp.route('/flashcards/flip', methods=['POST'])
@auth_required
def flip_flashcard_endpoint():
    """
    Flip a flashcard and award points.
    
    Auth: JWT required
    
    Request Body:
        {
            "flashcard_id": str
        }
    
    Returns:
        JSON response with points awarded and remaining flips
        - 200: Success with points awarded
        - 400: Invalid request or validation error
        - 404: Flashcard not found
        - 429: Daily limit exceeded
        - 500: Server error
    
    Response Format:
        {
            "points_awarded": int,
            "new_points_total": int,
            "flips_today": int,
            "flips_remaining": int
        }
    """
    data = None
    flashcard_id = None
    
    try:
        # Parse request body
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        flashcard_id = data.get('flashcard_id')
        if not flashcard_id:
            return jsonify({'error': 'flashcard_id is required'}), 400
        
        logger.info("Flipping flashcard", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "flashcard_id": flashcard_id
            }
        })
        
        # Flip flashcard and award points
        result = flip_flashcard(g.user_id, flashcard_id)
        
        logger.info("Flashcard flipped successfully", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "flashcard_id": flashcard_id,
                "points_awarded": result.get('points_awarded'),
                "new_points_total": result.get('new_points_total')
            }
        })
        
        return jsonify(result), 200
        
    except LimitExceeded as e:
        logger.warning("Daily flip limit exceeded", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "flashcard_id": flashcard_id if flashcard_id else 'unknown',
                "error": str(e)
            }
        })
        
        # Log limit blocked activity
        log_activity(
            user_id=g.user_id,
            activity_type=ACTIVITY_TYPES['LIMIT_BLOCKED'],
            metadata={'reason': 'Daily flashcard flip limit reached'}
        )
        
        return jsonify({'error': str(e)}), 429
        
    except NotFoundError as e:
        logger.warning("Flashcard not found", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "flashcard_id": flashcard_id if flashcard_id else 'unknown',
                "error": str(e)
            }
        })
        return jsonify({'error': str(e)}), 404
        
    except ValidationError as e:
        logger.warning("Validation error flipping flashcard", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "flashcard_id": flashcard_id if flashcard_id else 'unknown',
                "error": str(e)
            }
        })
        return jsonify({'error': str(e)}), 400
        
    except Exception as e:
        logger.error("Unexpected error flipping flashcard", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "flashcard_id": flashcard_id if flashcard_id else 'unknown',
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        return jsonify({'error': 'Internal server error'}), 500


@flashcard_bp.route('/flashcards/config', methods=['GET'])
@auth_required
def get_flashcard_config():
    """
    Get flashcard configuration and current week for the authenticated user.
    
    Auth: JWT required
    
    Returns:
        JSON response with flashcard constants and current week
        - 200: Success with config
        - 404: User not found
        - 500: Server error
    
    Response Format:
        {
            "current_week": int,
            "flashcards_per_session": int,
            "max_flips_per_day": int,
            "points_per_flip": int,
            "max_points_per_day": int
        }
    """
    try:
        logger.info("Getting flashcard config", extra={
            "extra_fields": {
                "user_id": g.user_id
            }
        })
        
        # Get current week from user profile
        try:
            current_week = compute_current_week_from_user(g.user_id)
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
            "flashcards_per_session": FLASHCARDS_PER_SESSION,
            "max_flips_per_day": FLASHCARD_FLIPS_PER_DAY,
            "points_per_flip": POINTS_PER_FLASHCARD_FLIP,
            "max_points_per_day": FLASHCARD_FLIPS_MAX_POINTS_PER_DAY
        }
        
        logger.info("Flashcard config retrieved successfully", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "current_week": current_week
            }
        })
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error("Unexpected error getting flashcard config", extra={
            "extra_fields": {
                "user_id": g.user_id,
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        return jsonify({'error': 'Internal server error'}), 500


@flashcard_bp.route('/flashcards/generate', methods=['POST'])
@admin_required
def generate_flashcards_endpoint():
    """
    Generate flashcards for a specific user (admin only).
    
    Auth: Admin role required or internal service token
    
    Request Body:
        {
            "user_id": str,
            "week": int,
            "count": int
        }
    
    Returns:
        JSON response with generation results
        - 200: Success with flashcards generated
        - 400: Invalid request or validation error
        - 403: Insufficient permissions
        - 404: User not found
        - 500: Server error
    
    Response Format:
        {
            "generated_count": int,
            "user_id": str,
            "week": int,
            "flashcard_ids": [str, ...]
        }
    """
    data = None
    user_id = None
    week = None
    count = None
    
    try:
        # Parse request body
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400
        
        user_id = data.get('user_id')
        week = data.get('week')
        count = data.get('count')
        
        # Validate required fields
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        if not week:
            return jsonify({'error': 'week is required'}), 400
        if not count:
            return jsonify({'error': 'count is required'}), 400
        
        # Validate parameter types and ranges
        if not isinstance(week, int) or week < 1 or week > 52:
            return jsonify({'error': 'week must be an integer between 1 and 52'}), 400
        
        if not isinstance(count, int) or count < 1 or count > 20:
            return jsonify({'error': 'count must be an integer between 1 and 20'}), 400
        
        logger.info("Admin generating flashcards", extra={
            "extra_fields": {
                "admin_user_id": g.user_id,
                "target_user_id": user_id,
                "week": week,
                "count": count
            }
        })
        
        # Generate flashcards
        flashcards = admin_generate_flashcards(user_id, week, count, token=None)
        
        # Format response
        result = {
            "generated_count": len(flashcards),
            "user_id": user_id,
            "week": week,
            "flashcard_ids": [str(flashcard.id) for flashcard in flashcards]
        }
        
        logger.info("Flashcards generated successfully by admin", extra={
            "extra_fields": {
                "admin_user_id": g.user_id,
                "target_user_id": user_id,
                "week": week,
                "generated_count": result["generated_count"]
            }
        })
        
        return jsonify(result), 200
        
    except NotFoundError as e:
        logger.warning("User not found for flashcard generation", extra={
            "extra_fields": {
                "admin_user_id": g.user_id,
                "target_user_id": user_id if user_id else 'unknown',
                "error": str(e)
            }
        })
        return jsonify({'error': str(e)}), 404
        
    except ValidationError as e:
        logger.warning("Validation error generating flashcards", extra={
            "extra_fields": {
                "admin_user_id": g.user_id,
                "target_user_id": user_id if user_id else 'unknown',
                "error": str(e)
            }
        })
        return jsonify({'error': str(e)}), 400
        
    except Exception as e:
        logger.error("Unexpected error generating flashcards", extra={
            "extra_fields": {
                "admin_user_id": g.user_id,
                "target_user_id": user_id if user_id else 'unknown',
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        return jsonify({'error': 'Internal server error'}), 500
