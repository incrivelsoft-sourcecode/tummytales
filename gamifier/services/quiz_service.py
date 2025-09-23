"""
Quiz Service for managing quiz sessions, questions, and game flow.
Core service handling quiz creation, answer submission, and session completion.
"""

import time
import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple

from models.user_game_profile import UserGameProfile
from models.quiz_session import QuizSession
from models.question import Question
from models.answer import Answer
from models.activity_log import ActivityLog, ACTIVITY_TYPES, log_activity
from services.user_data_service import get_user_profile, compute_current_week, UserDataServiceError
from services.rag_service import RAGService
from services.llm_client import LLMClient
from services.embeddings import EmbeddingService
from services.similarity_service import is_duplicate, add_to_index, check_duplicate_with_details
from models.llm_audit_log import log_llm_attempt
from services.streak_service import update_on_quiz_completion
from services.rewards_service import award_badges_if_eligible
from utils.xml_helpers import parse_quiz_xml
from utils.errors import LimitExceeded, SessionTimeoutError, NotFoundError, ValidationError
from utils.constants import (
    MAX_QUIZZES_PER_DAY, QUESTIONS_PER_SESSION, RETRY_LIMITS, 
    RAG_TOPK_QUIZ, QUIZ_SESSION_MAX_MINUTES, SESSION_STATUS,
    POINTS_PER_CORRECT_ANSWER
)
from utils.time_utils import now_utc, add_minutes
from config.env_loader import get_config
from config.logger import get_logger

logger = get_logger(__name__)


class QuizService:
    """Service class for quiz-related operations."""
    
    def __init__(self):
        """Initialize quiz service with required dependencies."""
        config = get_config()
        self.rag_service = RAGService()
        self.llm_client = LLMClient(api_key=config.CLAUDE_API_KEY)
        self.embedding_service = EmbeddingService(model_name=config.EMBEDDING_MODEL)


def start_quiz(user_id: str, difficulty: str, week: Optional[int] = None, token: Optional[str] = None) -> Dict[str, Any]:
    """
    Start a new quiz session for a user.
    
    Args:
        user_id: The user ID starting the quiz
        difficulty: Quiz difficulty level (easy, medium, hard)
        week: Optional pregnancy week (computed if not provided)
        
    Returns:
        dict: Quiz session data with session_id and questions (no answers)
        
    Raises:
        LimitExceeded: If user has exceeded daily quiz limit
        ValidationError: If invalid difficulty provided
    """
    correlation_id = f"start_quiz_{user_id}_{int(time.time())}"
    
    logger.info("Starting quiz session", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": user_id,
            "difficulty": difficulty,
            "week": week
        }
    })
    
    # Validate difficulty
    if difficulty not in ['easy', 'medium', 'hard']:
        raise ValidationError(f"Invalid difficulty: {difficulty}")
    
    try:
        # Step a) Load or create UserGameProfile and refresh limits
        profile = UserGameProfile.objects(user_id=user_id).first()
        if not profile:
            logger.info("Creating new user game profile", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id
                }
            })
            profile = UserGameProfile(user_id=user_id)
            profile.save()
        
        # Refresh daily limits
        profile.refresh_limits_if_needed()
        
        # Step b) Enforce daily quiz limit
        quizzes_today = profile.limits.get('quizzes_today', 0)
        if quizzes_today >= MAX_QUIZZES_PER_DAY:
            # Log limit blocked activity
            log_activity(
                user_id=user_id,
                activity_type=ACTIVITY_TYPES['LIMIT_BLOCKED'],
                metadata={
                    "type": "quiz",
                    "limit": MAX_QUIZZES_PER_DAY,
                    "current": quizzes_today,
                    "correlation_id": correlation_id
                }
            )
            
            logger.warning("User exceeded daily quiz limit", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id,
                    "quizzes_today": quizzes_today,
                    "limit": MAX_QUIZZES_PER_DAY
                }
            })
            raise LimitExceeded(f"Daily quiz limit of {MAX_QUIZZES_PER_DAY} exceeded")
        
        # Step c) Determine week
        if week is None:
            try:
                user_profile = get_user_profile(user_id, token)
                week = user_profile.get('current_week', 1)
                logger.info("Computed week from user profile", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "user_id": user_id,
                        "computed_week": week
                    }
                })
            except UserDataServiceError:
                week = 1  # Fallback
                logger.warning("Using fallback week due to user data service error", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "user_id": user_id,
                        "fallback_week": week
                    }
                })
        
        # Ensure week is an integer
        week = int(week) if week is not None else 1
        
        # Step d) Get RAG contexts
        service = QuizService()
        query_text = f"pregnancy week {week} {difficulty} information education quiz"
        rag_contexts = service.rag_service.search_by_week(
            query_text=query_text,
            week=week,
            top_k=RAG_TOPK_QUIZ
        )
        
        logger.info("Retrieved RAG contexts", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "week": week,
                "rag_count": len(rag_contexts)
            }
        })
        
        # Step e-h) Generate quiz questions with 3-attempt deduplication loop
        # Create user profile data for LLM generation
        try:
            user_profile = get_user_profile(user_id, token) if token else {"current_week": week}
            user_profile_data = user_profile
        except Exception as e:
            logger.warning("Failed to get full user profile, using minimal data", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id,
                    "error": str(e)
                }
            })
            user_profile_data = {"current_week": week}
        
        accepted_questions = []
        previous_rejections = []
        
        # Attempt generation up to 3 times
        for attempt in range(1, 4):
            logger.info(f"Quiz generation attempt {attempt}", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id,
                    "week": week,
                    "attempt": attempt
                }
            })
            
            try:
                # Call LLM to generate XML
                start_time = time.time()
                if attempt == 1:
                    xml_content = service.llm_client.generate_quiz(
                        user_profile=user_profile_data,
                        rag_contexts=rag_contexts,
                        difficulty=difficulty,
                        num_questions=QUESTIONS_PER_SESSION
                    )
                else:
                    # Use regeneration method with previous rejection context
                    xml_content = service.llm_client.generate_quiz_with_regeneration_context(
                        user_profile=user_profile_data,
                        rag_contexts=rag_contexts,
                        difficulty=difficulty,
                        num_questions=QUESTIONS_PER_SESSION,
                        previous_rejections=previous_rejections
                    )
                
                response_time_ms = int((time.time() - start_time) * 1000)
                
                # Parse XML -> candidate objects
                try:
                    question_dicts = parse_quiz_xml(xml_content)
                    parsing_success = True
                    validation_success = True
                except Exception as parse_error:
                    parsing_success = False
                    validation_success = False
                    logger.warning(f"XML parsing failed on attempt {attempt}", extra={
                        "extra_fields": {
                            "correlation_id": correlation_id,
                            "user_id": user_id,
                            "attempt": attempt,
                            "error": str(parse_error)
                        }
                    })
                    
                    # Log LLM attempt with parsing failure
                    prompt_hash = hashlib.md5(f"{user_profile_data}_{rag_contexts}_{difficulty}".encode()).hexdigest()
                    log_llm_attempt(
                        user_id=user_id,
                        content_type='quiz',
                        attempt_number=attempt,
                        week=week,
                        prompt_hash=prompt_hash,
                        raw_response=xml_content,
                        difficulty=difficulty,
                        rag_context_ids=[str(ctx.get('id', '')) for ctx in rag_contexts if ctx.get('id')],
                        response_time_ms=response_time_ms,
                        parsing_success=parsing_success,
                        validation_success=validation_success,
                        error_type='parsing_error',
                        error_message=str(parse_error)
                    )
                    
                    if attempt < 3:
                        previous_rejections.append(f"XML parsing failed: {str(parse_error)}")
                        continue
                    else:
                        # On final attempt, accept parsing failure if configured
                        raise ValidationError(f"Failed to parse XML after {attempt} attempts: {str(parse_error)}")
                
                logger.info("Parsed quiz XML", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "user_id": user_id,
                        "attempt": attempt,
                        "questions_count": len(question_dicts)
                    }
                })
                
                # For each candidate, compute embedding and check similarity
                duplicate_candidates = []
                valid_candidates = []
                similarity_scores_all = []
                
                for i, question_dict in enumerate(question_dicts):
                    question_text = question_dict.get('text', '')
                    if not question_text.strip():
                        continue
                    
                    # Compute embedding
                    question_vector = service.embedding_service.embed_text(question_text)
                    
                    # Check for duplicates with details
                    duplicate_check = check_duplicate_with_details(
                        candidate_vector=question_vector,
                        user_id=user_id,
                        week=week,
                        content_type='quiz'
                    )
                    
                    similarity_scores_all.extend(duplicate_check['similarity_scores'])
                    
                    if duplicate_check['is_duplicate']:
                        duplicate_candidates.append({
                            'question_dict': question_dict,
                            'vector': question_vector,
                            'check_result': duplicate_check
                        })
                        
                        # Log duplicate rejection activity
                        log_activity(
                            user_id=user_id,
                            activity_type=ACTIVITY_TYPES['DUPLICATE_REJECT'],
                            metadata={
                                "content_type": "quiz",
                                "week": week,
                                "attempt": attempt,
                                "reason": duplicate_check['reason'],
                                "similarity": duplicate_check['max_similarity'],
                                "question_index": i
                            }
                        )
                    else:
                        valid_candidates.append({
                            'question_dict': question_dict,
                            'vector': question_vector,
                            'check_result': duplicate_check
                        })
                
                # Log LLM attempt
                prompt_hash = hashlib.md5(f"{user_profile_data}_{rag_contexts}_{difficulty}".encode()).hexdigest()
                log_llm_attempt(
                    user_id=user_id,
                    content_type='quiz',
                    attempt_number=attempt,
                    week=week,
                    prompt_hash=prompt_hash,
                    raw_response=xml_content,
                    difficulty=difficulty,
                    rag_context_ids=[str(ctx.get('id', '')) for ctx in rag_contexts if ctx.get('id')],
                    response_time_ms=response_time_ms,
                    parsing_success=parsing_success,
                    validation_success=validation_success,
                    duplicate_detected=len(duplicate_candidates) > 0,
                    similarity_scores=similarity_scores_all
                )
                
                # If any candidates flagged duplicate and we're not on final attempt
                if duplicate_candidates and attempt < 3:
                    rejection_reason = f"Attempt {attempt}: {len(duplicate_candidates)} duplicates detected with max similarity {max([dc['check_result']['max_similarity'] for dc in duplicate_candidates]):.3f}"
                    previous_rejections.append(rejection_reason)
                    
                    logger.warning("Duplicates detected, will regenerate", extra={
                        "extra_fields": {
                            "correlation_id": correlation_id,
                            "user_id": user_id,
                            "week": week,
                            "attempt": attempt,
                            "duplicate_count": len(duplicate_candidates),
                            "valid_count": len(valid_candidates)
                        }
                    })
                    continue
                    
                # On final attempt (attempt 3) or no duplicates detected
                if attempt == 3 and duplicate_candidates:
                    # Accept with low-confidence (3rd attempt rule)
                    logger.warning("Final attempt - accepting candidates despite duplicates", extra={
                        "extra_fields": {
                            "correlation_id": correlation_id,
                            "user_id": user_id,
                            "week": week,
                            "attempt": attempt,
                            "duplicate_count": len(duplicate_candidates),
                            "valid_count": len(valid_candidates)
                        }
                    })
                    # Add duplicate candidates to valid list for final attempt
                    valid_candidates.extend(duplicate_candidates)
                
                # Persist accepted Questions and add to SimilarityIndex
                for candidate in valid_candidates:
                    question_dict = candidate['question_dict']
                    question_vector = candidate['vector']
                    question_text = question_dict.get('text', '')
                    
                    question = Question(
                        user_id=user_id,
                        week=week,
                        difficulty=difficulty,
                        text=question_text,
                        option_a=question_dict['options'].get('A', ''),
                        option_b=question_dict['options'].get('B', ''),
                        option_c=question_dict['options'].get('C', ''),
                        option_d=question_dict['options'].get('D', ''),
                        correct_option=question_dict['answer'],
                        explanation=question_dict.get('explanation', ''),
                        xml=xml_content,
                        embedding_vector=question_vector,
                        rag_chunk_ids=[str(ctx.get('id', '')) for ctx in rag_contexts if ctx.get('id')]
                    )
                    question.save()
                    
                    # Add to similarity index
                    text_hash = hashlib.md5(question_text.encode()).hexdigest()
                    add_to_index(user_id, week, 'quiz', question_vector, text_hash)
                    
                    accepted_questions.append(question)
                
                logger.info("Quiz generation completed successfully", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "user_id": user_id,
                        "week": week,
                        "attempt": attempt,
                        "accepted_count": len(accepted_questions)
                    }
                })
                break
                
            except Exception as e:
                logger.error(f"Quiz generation attempt {attempt} failed", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "user_id": user_id,
                        "week": week,
                        "attempt": attempt,
                        "error": str(e)
                    }
                })
                
                if attempt == 3:
                    raise ValidationError(f"Quiz generation failed after {attempt} attempts: {str(e)}")
                else:
                    previous_rejections.append(f"Attempt {attempt} failed: {str(e)}")
                    continue
        
        if not accepted_questions:
            raise ValidationError("No valid questions could be generated")
        
        # Step i) Create QuizSession with questions snapshot
        started_at = now_utc()
        timeout_at = add_minutes(started_at, QUIZ_SESSION_MAX_MINUTES)
        
        # Create questions snapshot (no correct_option visible)
        questions_snapshot = []
        for question in accepted_questions:
            questions_snapshot.append({
                "question_id": str(question.id),
                "text": question.text,
                "options": {
                    "A": question.option_a,
                    "B": question.option_b,
                    "C": question.option_c,
                    "D": question.option_d
                }
            })
        
        quiz_session = QuizSession(
            user_id=user_id,
            difficulty_selected=difficulty,
            week_at_start=week,
            status=SESSION_STATUS["STARTED"],
            started_at=started_at,
            timeout_at=timeout_at,
            total_questions=len(accepted_questions),
            questions=questions_snapshot,
            answer_attempts=[]
        )
        quiz_session.save()
        
        # Step k) Log activity
        log_activity(
            user_id=user_id,
            activity_type=ACTIVITY_TYPES['QUIZ_START'],
            metadata={
                "session_id": str(quiz_session.id),
                "difficulty": difficulty,
                "week": week,
                "questions_count": len(accepted_questions),
                "correlation_id": correlation_id
            }
        )
        
        logger.info("Successfully started quiz session", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "session_id": str(quiz_session.id),
                "difficulty": difficulty,
                "week": week,
                "questions_count": len(accepted_questions)
            }
        })
        
        # Step l) Return response
        return {
            "session_id": str(quiz_session.id),
            "expires_in_seconds": QUIZ_SESSION_MAX_MINUTES * 60,
            "questions": questions_snapshot
        }
        
    except Exception as e:
        logger.error("Failed to start quiz", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "difficulty": difficulty,
                "week": week,
                "error": str(e)
            }
        })
        raise


def submit_answer(session_id: str, question_id: str, selected_option: str, 
                 started_at: datetime, answered_at: datetime) -> Dict[str, Any]:
    """
    Submit an answer for a quiz question.
    
    Args:
        session_id: The quiz session ID
        question_id: The question ID being answered
        selected_option: The selected option (A, B, C, or D)
        started_at: When user started answering this question
        answered_at: When user submitted the answer
        
    Returns:
        dict: Answer result with correctness, retry info, and preview points
        
    Raises:
        NotFoundError: If session or question not found
        SessionTimeoutError: If session has timed out
        ValidationError: If invalid option provided
    """
    correlation_id = f"submit_answer_{session_id}_{question_id}_{int(time.time())}"
    
    logger.info("Submitting quiz answer", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "session_id": session_id,
            "question_id": question_id,
            "selected_option": selected_option
        }
    })
    
    # Validate selected option
    if selected_option not in ['A', 'B', 'C', 'D']:
        raise ValidationError(f"Invalid selected option: {selected_option}")
    
    try:
        # Load session
        session = QuizSession.objects(id=session_id).first()
        if not session:
            raise NotFoundError(f"Quiz session not found: {session_id}")
        
        # Check if session timed out
        if session.is_timed_out(now_utc()):
            session.update(status=SESSION_STATUS["TIMED_OUT"])
            raise SessionTimeoutError("Quiz session has timed out")
        
        # Load question
        question = Question.objects(id=question_id).first()
        if not question:
            raise NotFoundError(f"Question not found: {question_id}")
        
        # Check how many attempts for this question
        existing_attempts = [
            attempt for attempt in session.answer_attempts 
            if attempt.get('question_id') == question_id
        ]
        retry_index = len(existing_attempts)
        
        # Determine correctness
        is_correct = question.correct_option == selected_option
        
        # Create answer attempt record
        time_taken = (answered_at - started_at).total_seconds()
        attempt_record = {
            "question_id": question_id,
            "selected_option": selected_option,
            "is_correct": is_correct,
            "retry_index": retry_index,
            "started_at": started_at,
            "answered_at": answered_at,
            "time_taken_seconds": time_taken
        }
        
        # Append to session
        session.append_answer_attempt(attempt_record)
        
        # RETRY LOGIC: If answer is wrong and this is the first attempt, add question for retry
        updated_questions = None
        
        logger.info("Checking retry logic conditions", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "is_correct": is_correct,
                "retry_index": retry_index,
                "should_check_retry": not is_correct and retry_index == 0
            }
        })
        
        if not is_correct and retry_index == 0:
            # Check if this question has already been added for retry in this session
            question_already_in_retry = any(
                q.get('question_id') == question_id and q.get('is_retry', False) 
                for q in session.questions
            )
            
            logger.info("Retry logic check", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "question_already_in_retry": question_already_in_retry,
                    "session_questions_count": len(session.questions)
                }
            })
            
            if not question_already_in_retry:
                # Find the original question data in session
                original_question = None
                for q in session.questions:
                    if q.get('question_id') == question_id:
                        original_question = q
                        break
                
                if original_question:
                    logger.info("Creating retry question", extra={
                        "extra_fields": {
                            "correlation_id": correlation_id,
                            "original_question_found": True,
                            "original_question_id": question_id
                        }
                    })
                    
                    # Create retry question by copying original and marking as retry
                    retry_question = original_question.copy()
                    retry_question['is_retry'] = True
                    retry_question['original_question_id'] = question_id
                    retry_question['retry_reason'] = 'answered_incorrectly'
                    
                    # Add to end of session questions
                    session.questions.append(retry_question)
                    session.total_questions += 1
                    
                    # Save session with updated questions
                    session.save()
                    
                    # Reload session to get fresh data
                    session.reload()
                    
                    # Return updated questions list for frontend
                    updated_questions = list(session.questions)  # Convert to list to ensure serialization
                    
                    logger.info("Successfully added question for retry", extra={
                        "extra_fields": {
                            "correlation_id": correlation_id,
                            "session_id": session_id,
                            "question_id": question_id,
                            "new_total_questions": session.total_questions,
                            "updated_questions_count": len(updated_questions),
                            "retry_question_created": True
                        }
                    })
                else:
                    logger.warning("Original question not found for retry", extra={
                        "extra_fields": {
                            "correlation_id": correlation_id,
                            "question_id": question_id,
                            "session_questions_count": len(session.questions)
                        }
                    })
        
        # Also create standalone Answer document for stats queries
        answer_doc = Answer(
            session_id=session_id,
            question_id=question_id,
            selected_option=selected_option,
            is_correct=is_correct,
            retry_index=retry_index,
            started_at=started_at,
            answered_at=answered_at,
            time_taken_seconds=time_taken
        )
        answer_doc.save()
        
        # Determine if retry is allowed
        retry_allowed = False
        if not is_correct and retry_index < RETRY_LIMITS:
            retry_allowed = True
        
        # Preview points (not awarded yet)
        preview_points = POINTS_PER_CORRECT_ANSWER if is_correct else 0
        
        # Determine next action
        if is_correct:
            next_action = "continue"
        elif retry_allowed:
            next_action = "retry"
        else:
            next_action = "continue"
        
        # Log answer activity
        log_activity(
            user_id=session.user_id,
            activity_type=ACTIVITY_TYPES['ANSWER'],
            metadata={
                "session_id": session_id,
                "question_id": question_id,
                "selected_option": selected_option,
                "is_correct": is_correct,
                "retry_index": retry_index,
                "time_taken_seconds": time_taken,
                "correlation_id": correlation_id
            }
        )
        
        logger.info("Successfully submitted answer", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "session_id": session_id,
                "question_id": question_id,
                "is_correct": is_correct,
                "retry_allowed": retry_allowed,
                "retry_index": retry_index,
                "questions_updated": updated_questions is not None
            }
        })
        
        response = {
            "is_correct": is_correct,
            "retry_allowed": retry_allowed,
            "preview_points": preview_points,
            "next_action": next_action
        }
        
        # Include updated questions if retry question was added
        if updated_questions is not None:
            response["updated_questions"] = updated_questions
            response["total_questions"] = len(updated_questions)
        
        return response
        
    except Exception as e:
        logger.error("Failed to submit answer", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "session_id": session_id,
                "question_id": question_id,
                "error": str(e)
            }
        })
        raise


def complete_session(session_id: str) -> Dict[str, Any]:
    """
    Complete a quiz session and award points.
    
    Args:
        session_id: The quiz session ID to complete
        
    Returns:
        dict: Completion results with score, points, and badges
        
    Raises:
        NotFoundError: If session not found
        SessionTimeoutError: If session timed out
    """
    correlation_id = f"complete_session_{session_id}_{int(time.time())}"
    
    logger.info("Completing quiz session", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "session_id": session_id
        }
    })
    
    try:
        # Load session
        session = QuizSession.objects(id=session_id).first()
        if not session:
            raise NotFoundError(f"Quiz session not found: {session_id}")
        
        # Check if session timed out
        current_time = now_utc()
        if session.is_timed_out(current_time):
            session.update(status=SESSION_STATUS["TIMED_OUT"])
            logger.warning("Session timed out, no points awarded", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "session_id": session_id,
                    "user_id": session.user_id
                }
            })
            raise SessionTimeoutError("Quiz session has timed out")
        
        # Analyze answers and determine final attempts
        question_results = {}
        for attempt in session.answer_attempts:
            q_id = attempt['question_id']
            if q_id not in question_results:
                question_results[q_id] = []
            question_results[q_id].append(attempt)
        
        # Calculate score based on final attempts (Answer documents already created in submit_answer)
        correct_count = 0
        for question_id, attempts in question_results.items():
            # Use the last attempt as final
            final_attempt = attempts[-1]
            
            if final_attempt['is_correct']:
                correct_count += 1
        
        # Calculate score and points
        score = correct_count * 10  # 10 points per correct answer
        awarded_points = score
        
        # Update session
        session.update(
            status=SESSION_STATUS["COMPLETED"],
            completed_at=current_time,
            score=score,
            awarded_points=awarded_points
        )
        
        # Update user profile points and quiz count
        profile = UserGameProfile.objects(user_id=session.user_id).first()
        if profile:
            profile.increment_points(awarded_points)
            profile.increment_quizzes_today()
        
        # Log completion activity
        log_activity(
            user_id=session.user_id,
            activity_type=ACTIVITY_TYPES['QUIZ_COMPLETE'],
            metadata={
                "session_id": session_id,
                "score": score,
                "awarded_points": awarded_points,
                "correct_count": correct_count,
                "total_questions": session.total_questions,
                "correlation_id": correlation_id
            },
            points_delta=awarded_points
        )
        
        # Update streak
        completion_date = current_time.date()
        streak_info = update_on_quiz_completion(session.user_id, completion_date)
        
        # Award badges if eligible
        badges_awarded = award_badges_if_eligible(session.user_id, completion_date)
        
        logger.info("Successfully completed quiz session", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "session_id": session_id,
                "user_id": session.user_id,
                "score": score,
                "awarded_points": awarded_points,
                "badges_awarded": badges_awarded,
                "streak_info": streak_info
            }
        })
        
        return {
            "score": score,
            "awarded_points": awarded_points,
            "badges_awarded": badges_awarded
        }
        
    except Exception as e:
        logger.error("Failed to complete session", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "session_id": session_id,
                "error": str(e)
            }
        })
        raise


def get_session_status(session_id: str) -> Dict[str, Any]:
    """
    Get current status of a quiz session.
    
    Args:
        session_id: The quiz session ID
        
    Returns:
        dict: Session status including remaining time
        
    Raises:
        NotFoundError: If session not found
    """
    try:
        session = QuizSession.objects(id=session_id).first()
        if not session:
            raise NotFoundError(f"Quiz session not found: {session_id}")
        
        current_time = now_utc()
        remaining_seconds = session.get_remaining_seconds(current_time)
        
        # Get question status
        questions_status = []
        answered_questions = set()
        for attempt in session.answer_attempts:
            answered_questions.add(attempt['question_id'])
        
        for question in session.questions:
            is_answered = question['question_id'] in answered_questions
            questions_status.append({
                "question_id": question['question_id'],
                "status": "answered" if is_answered else "unanswered"
            })
        
        return {
            "session_id": session_id,
            "status": session.status,
            "remaining_seconds": max(0, remaining_seconds),
            "questions_status": questions_status,
            "started_at": session.started_at.isoformat() if session.started_at else None,
            "timeout_at": session.timeout_at.isoformat() if session.timeout_at else None
        }
        
    except Exception as e:
        logger.error("Failed to get session status", extra={
            "extra_fields": {
                "session_id": session_id,
                "error": str(e)
            }
        })
        raise
