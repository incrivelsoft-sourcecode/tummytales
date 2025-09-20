"""
Flashcard Service for managing flashcard generation, retrieval, and flipping.
Handles personalized flashcard creation and point awarding.
"""

import time
import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Any, TYPE_CHECKING

if TYPE_CHECKING:
    from models.flashcard import Flashcard

from models.user_game_profile import UserGameProfile
from models.activity_log import ActivityLog, ACTIVITY_TYPES, log_activity
from services.user_data_service import get_user_profile, compute_current_week
from services.rag_service import RAGService
from services.llm_client import LLMClient
from services.embeddings import EmbeddingService
from services.similarity_service import is_duplicate, add_to_index, check_duplicate_with_details
from models.llm_audit_log import log_llm_attempt
from utils.xml_helpers import parse_flashcards_xml
from utils.errors import LimitExceeded, NotFoundError, ValidationError
from utils.constants import (
    FLASHCARD_FLIPS_PER_DAY, FLASHCARDS_PER_SESSION, 
    RAG_TOPK_FLASHCARD, POINTS_PER_FLASHCARD_FLIP,
    FLASHCARD_FLIPS_MAX_POINTS_PER_DAY
)
from utils.time_utils import now_utc
from config.env_loader import get_config
from config.logger import get_logger

logger = get_logger(__name__)


class FlashcardService:
    """Service class for flashcard-related operations."""
    
    def __init__(self):
        """Initialize flashcard service with required dependencies."""
        config = get_config()
        self.rag_service = RAGService()
        self.llm_client = LLMClient(api_key=config.CLAUDE_API_KEY)
        self.embedding_service = EmbeddingService(model_name=config.EMBEDDING_MODEL)


def get_daily_flashcards(user_id: str, week: int, limit: int = FLASHCARDS_PER_SESSION, token: Optional[str] = None) -> List[Any]:
    """
    Get daily flashcards for a user - same flashcards throughout the day.
    
    Args:
        user_id: The user ID requesting flashcards
        week: The pregnancy week (1-40)
        limit: Maximum number of flashcards to return (default: 3)
        
    Returns:
        List[Flashcard]: List of flashcard objects for today
        
    Raises:
        ValidationError: If invalid parameters provided
        NotFoundError: If user profile not found
    """
    from datetime import datetime, timezone
    
    correlation_id = f"get_daily_flashcards_{user_id}_{week}_{int(time.time())}"
    
    logger.info("Getting daily flashcards", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": user_id,
            "week": week,
            "limit": limit
        }
    })
    
    # Validate inputs
    if not user_id or not user_id.strip():
        raise ValidationError("User ID is required")
    
    if week < 1 or week > 40:
        raise ValidationError(f"Invalid week: {week}. Must be between 1 and 40")
    
    if limit < 1 or limit > 10:
        raise ValidationError(f"Invalid limit: {limit}. Must be between 1 and 10")
    
    try:
        # Step 1: Get today's date range (start and end of day)
        today = now_utc().date()
        start_of_day = datetime.combine(today, datetime.min.time().replace(tzinfo=timezone.utc))
        end_of_day = datetime.combine(today, datetime.max.time().replace(tzinfo=timezone.utc))
        
        # Step 2: Look for existing flashcards created today for this user/week
        from models.flashcard import Flashcard
        today_flashcards = Flashcard.objects(
            user_id=user_id,
            week=week,
            created_at__gte=start_of_day,
            created_at__lte=end_of_day
        ).order_by('-created_at').limit(limit)
        
        today_list = list(today_flashcards)
        
        logger.debug("Retrieved today's flashcards", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "week": week,
                "today_count": len(today_list),
                "requested_limit": limit,
                "date": today.isoformat()
            }
        })
        
        # Step 3: If we have sufficient flashcards for today, return them
        if len(today_list) >= limit:
            logger.info("Returning today's existing flashcards", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id,
                    "week": week,
                    "flashcards_count": len(today_list[:limit]),
                    "date": today.isoformat()
                }
            })
            return today_list[:limit]
        
        # Step 4: If no flashcards for today, generate new ones for today
        needed_count = limit - len(today_list)
        
        logger.info("Generating new daily flashcards", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "week": week,
                "existing_today_count": len(today_list),
                "needed_count": needed_count,
                "date": today.isoformat()
            }
        })
        
        # Generate new flashcards for today
        new_flashcards = _generate_flashcards(
            user_id=user_id,
            week=week,
            num_cards=needed_count,
            correlation_id=correlation_id,
            token=token
        )
        
        # Combine today's existing and new flashcards
        all_today_flashcards = today_list + new_flashcards
        
        logger.info("Completed daily flashcard retrieval", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "week": week,
                "total_flashcards": len(all_today_flashcards),
                "existing_today_count": len(today_list),
                "new_count": len(new_flashcards),
                "date": today.isoformat()
            }
        })
        
        return all_today_flashcards[:limit]
        
    except Exception as e:
        logger.error("Failed to get daily flashcards", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "week": week,
                "error": str(e)
            }
        })
        raise


def get_personalized_flashcards(user_id: str, week: int, limit: int = FLASHCARDS_PER_SESSION, token: Optional[str] = None) -> List[Any]:
    """
    Get personalized flashcards for a user and week.
    DEPRECATED: Use get_daily_flashcards for daily persistence.
    
    Args:
        user_id: The user ID requesting flashcards
        week: The pregnancy week (1-40)
        limit: Maximum number of flashcards to return (default: 3)
        
    Returns:
        List[Flashcard]: List of flashcard objects
        
    Raises:
        ValidationError: If invalid parameters provided
        NotFoundError: If user profile not found
    """
    # Delegate to daily flashcards for consistent behavior
    return get_daily_flashcards(user_id, week, limit)


def flip_flashcard(user_id: str, flashcard_id: str) -> Dict[str, Any]:
    """
    Handle flashcard flip action and award points.
    
    Args:
        user_id: The user ID flipping the flashcard
        flashcard_id: The flashcard ID being flipped
        
    Returns:
        Dict: Points awarded and current totals
        
    Raises:
        LimitExceeded: If user has exceeded daily flip limit
        NotFoundError: If flashcard not found or doesn't belong to user
        ValidationError: If invalid parameters provided
    """
    correlation_id = f"flip_flashcard_{user_id}_{flashcard_id}_{int(time.time())}"
    
    logger.info("Processing flashcard flip", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": user_id,
            "flashcard_id": flashcard_id
        }
    })
    
    # Validate inputs
    if not user_id or not user_id.strip():
        raise ValidationError("User ID is required")
    
    if not flashcard_id or not flashcard_id.strip():
        raise ValidationError("Flashcard ID is required")
    
    try:
        # Step 1: Load user profile and refresh limits
        profile = UserGameProfile.objects(user_id=user_id).first()
        if not profile:
            # Auto-create profile if it doesn't exist (consistent with quiz service)
            logger.info("Creating new user game profile for flashcard flip", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id
                }
            })
            profile = UserGameProfile(user_id=user_id)
            profile.save()
        
        # Refresh daily limits
        profile.refresh_limits_if_needed()
        
        # Step 2: Check daily flip limit
        flips_today = profile.limits.get('flips_today', 0)
        if flips_today >= FLASHCARD_FLIPS_PER_DAY:
            # Log limit blocked activity
            log_activity(
                user_id=user_id,
                activity_type=ACTIVITY_TYPES['LIMIT_BLOCKED'],
                metadata={
                    'action': 'flashcard_flip',
                    'current_flips': flips_today,
                    'daily_limit': FLASHCARD_FLIPS_PER_DAY
                }
            )
            
            logger.info("Daily flip limit reached, returning graceful response", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id,
                    "flips_today": flips_today,
                    "limit": FLASHCARD_FLIPS_PER_DAY
                }
            })
            
            # Return graceful response instead of throwing exception
            return {
                "points_awarded": 0,
                "new_points_total": profile.points.get('lifetime', 0),
                "flips_today": flips_today,
                "flips_remaining": 0,
                "daily_limit_reached": True,
                "message": "Daily flashcard flip limit reached"
            }
        
        # Step 3: Verify flashcard exists and belongs to user
        from models.flashcard import Flashcard
        flashcard = Flashcard.objects(id=flashcard_id, user_id=user_id).first()
        if not flashcard:
            raise NotFoundError(f"Flashcard not found or does not belong to user: {flashcard_id}")
        
        # Step 4: Calculate points to award
        points_awarded = POINTS_PER_FLASHCARD_FLIP
        
        # Check if daily points cap would be exceeded
        current_points_today = profile.points.get('today', 0)
        if current_points_today + points_awarded > FLASHCARD_FLIPS_MAX_POINTS_PER_DAY:
            # Cap the points to the maximum allowed
            points_awarded = max(0, FLASHCARD_FLIPS_MAX_POINTS_PER_DAY - current_points_today)
            logger.info("Capping flashcard points due to daily limit", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id,
                    "original_points": POINTS_PER_FLASHCARD_FLIP,
                    "capped_points": points_awarded,
                    "current_points_today": current_points_today
                }
            })
        
        # Step 5: Mark flashcard as flipped and atomically update flip count and points
        flashcard.flipped_at = now_utc()
        flashcard.save()
        
        profile.increment_flips_today()
        
        if points_awarded > 0:
            profile.increment_points(points_awarded)
        
        # Step 6: Log activity
        log_activity(
            user_id=user_id,
            activity_type=ACTIVITY_TYPES['FLASHCARD_FLIP'],
            metadata={
                'flashcard_id': flashcard_id,
                'week': flashcard.week,
                'section': flashcard.section,
                'difficulty': flashcard.difficulty,
                'flips_count': flips_today + 1,
                'points_awarded': points_awarded
            },
            points_delta=points_awarded
        )
        
        # Step 7: Reload profile to get updated values
        profile.reload()
        
        # Step 8: Return updated points and limit status
        result = {
            'points_awarded': points_awarded,
            'total_points': profile.points.get('lifetime', 0),  # Add total_points as expected by tests
            'points_today': profile.points.get('today', 0),
            'points_lifetime': profile.points.get('lifetime', 0),
            'flips_today': profile.limits.get('flips_today', 0),
            'flips_remaining': max(0, FLASHCARD_FLIPS_PER_DAY - profile.limits.get('flips_today', 0)),
            'daily_limit': FLASHCARD_FLIPS_PER_DAY
        }
        
        logger.info("Successfully processed flashcard flip", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "flashcard_id": flashcard_id,
                "points_awarded": points_awarded,
                "flips_today": result['flips_today'],
                "flips_remaining": result['flips_remaining']
            }
        })
        
        return result
        
    except (LimitExceeded, NotFoundError, ValidationError):
        # Re-raise these specific exceptions
        raise
    except Exception as e:
        logger.error("Failed to process flashcard flip", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "flashcard_id": flashcard_id,
                "error": str(e)
            }
        })
        raise


def get_user_flashcards(user_id: str, week: Optional[int] = None, flipped_only: Optional[bool] = None) -> List[Any]:
    """
    Retrieve flashcards for a user with optional filtering.
    
    Args:
        user_id: The user ID to get flashcards for
        week: Optional week filter (1-40)
        flipped_only: Optional filter - True for flipped only, False for unflipped only, None for all
        
    Returns:
        List[Flashcard]: List of matching flashcard objects
        
    Raises:
        ValidationError: If parameters are invalid
    """
    from models.flashcard import Flashcard
    
    correlation_id = f"get_user_flashcards_{user_id}_{int(time.time() * 1000)}"
    
    try:
        # Validate user_id
        if not user_id or not user_id.strip():
            raise ValidationError("user_id cannot be empty")
        
        # Build query filters
        query_filters: Dict[str, Any] = {'user_id': user_id}
        
        # Add week filter if specified
        if week is not None:
            if not (1 <= week <= 40):
                raise ValidationError(f"Week must be between 1-40, got: {week}")
            query_filters['week'] = week
        
        # Add flipped filter if specified
        if flipped_only is not None:
            if flipped_only:
                # Only flipped cards (flipped_at is not None)
                query_filters['flipped_at__ne'] = None
            else:
                # Only unflipped cards (flipped_at is None)
                query_filters['flipped_at'] = None
        
        logger.debug("Querying user flashcards", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "week": week,
                "flipped_only": flipped_only,
                "query_filters": query_filters
            }
        })
        
        # Query database
        flashcards = list(Flashcard.objects(**query_filters).order_by('-created_at'))
        
        logger.info("Retrieved user flashcards", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "week": week,
                "flipped_only": flipped_only,
                "flashcards_count": len(flashcards)
            }
        })
        
        return flashcards
        
    except ValidationError:
        # Re-raise validation errors
        raise
    except Exception as e:
        logger.error("Failed to retrieve user flashcards", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "week": week,
                "flipped_only": flipped_only,
                "error": str(e)
            }
        })
        raise


def admin_generate_flashcards(user_id: str, week: int, num_cards: int = FLASHCARDS_PER_SESSION, force_regen: bool = False, token: Optional[str] = None) -> List[Any]:
    """
    Admin endpoint to forcibly regenerate flashcards for a user/week.
    
    Args:
        user_id: The user ID to generate flashcards for
        week: The pregnancy week (1-40)
        num_cards: Number of flashcards to generate (default: 3)
        force_regen: Whether to regenerate even if cards exist (default: False)
        
    Returns:
        List[Flashcard]: Generated flashcard objects
        
    Raises:
        ValidationError: If invalid parameters provided
        NotFoundError: If user profile not found
    """
    correlation_id = f"admin_gen_flashcards_{user_id}_{week}_{int(time.time())}"
    
    logger.info("Admin generating flashcards", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": user_id,
            "week": week,
            "num_cards": num_cards,
            "force_regen": force_regen
        }
    })
    
    # Validate inputs
    if not user_id or not user_id.strip():
        raise ValidationError("User ID is required")
    
    if week < 1 or week > 40:
        raise ValidationError(f"Invalid week: {week}. Must be between 1 and 40")
    
    if num_cards < 1 or num_cards > 20:
        raise ValidationError(f"Invalid num_cards: {num_cards}. Must be between 1 and 20")
    
    try:
        # Delete existing flashcards if force regeneration
        if force_regen:
            from models.flashcard import Flashcard
            deleted_count = Flashcard.objects(user_id=user_id, week=week).delete()
            logger.info("Deleted existing flashcards for regeneration", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id,
                    "week": week,
                    "deleted_count": deleted_count
                }
            })
        
        # Generate new flashcards
        new_flashcards = _generate_flashcards(
            user_id=user_id,
            week=week,
            num_cards=num_cards,
            correlation_id=correlation_id,
            token=token
        )
        
        logger.info("Admin flashcard generation completed", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "week": week,
                "generated_count": len(new_flashcards),
                "force_regen": force_regen
            }
        })
        
        return new_flashcards
        
    except Exception as e:
        logger.error("Failed to admin generate flashcards", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "week": week,
                "error": str(e)
            }
        })
        raise


def _generate_flashcards(user_id: str, week: int, num_cards: int, correlation_id: str, token: Optional[str] = None) -> List[Any]:
    """
    Internal function to generate new flashcards with RAG context and duplicate checking.
    
    Args:
        user_id: The user ID
        week: The pregnancy week
        num_cards: Number of flashcards to generate
        correlation_id: Correlation ID for logging
        
    Returns:
        List[Flashcard]: Generated flashcard objects
        
    Raises:
        NotFoundError: If user profile not found
        ValidationError: If generation fails or produces invalid content
    """
    logger.info("Starting flashcard generation", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": user_id,
            "week": week,
            "num_cards": num_cards
        }
    })
    
    try:
        # Step 1: Get user profile for personalization
        user_profile = get_user_profile(user_id, token)
        if not user_profile:
            raise NotFoundError(f"User profile not found for user: {user_id}")
        
        # Step 2: Get RAG contexts for the week
        service = FlashcardService()
        
        # Build query based on week
        query_text = f"pregnancy week {week} information health nutrition development"
        
        rag_contexts = service.rag_service.search_by_week(
            query_text=query_text,
            week=week,
            top_k=RAG_TOPK_FLASHCARD
        )
        
        logger.debug("Retrieved RAG contexts", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "week": week,
                "rag_contexts_count": len(rag_contexts)
            }
        })
        
        # Step 3-5: Generate flashcards with 3-attempt deduplication loop
        created_flashcards = []
        previous_rejections = []
        
        # Attempt generation up to 3 times
        for attempt in range(1, 4):
            logger.info(f"Flashcard generation attempt {attempt}", extra={
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
                    xml_response = service.llm_client.generate_flashcards(
                        user_profile=user_profile,
                        rag_contexts=rag_contexts,
                        num_cards=num_cards
                    )
                else:
                    # Use regeneration method with previous rejection context
                    xml_response = service.llm_client.generate_flashcards_with_regeneration_context(
                        user_profile=user_profile,
                        rag_contexts=rag_contexts,
                        num_cards=num_cards,
                        previous_rejections=previous_rejections
                    )
                
                response_time_ms = int((time.time() - start_time) * 1000)
                
                # Parse XML -> candidate objects
                try:
                    parsed_flashcards = parse_flashcards_xml(xml_response)
                    parsing_success = True
                    validation_success = True
                    
                    if not parsed_flashcards:
                        parsing_success = False
                        raise ValidationError("No valid flashcards generated")
                        
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
                    prompt_hash = hashlib.md5(f"{user_profile}_{rag_contexts}_{num_cards}".encode()).hexdigest()
                    log_llm_attempt(
                        user_id=user_id,
                        content_type='flashcard',
                        attempt_number=attempt,
                        week=week,
                        prompt_hash=prompt_hash,
                        raw_response=xml_response,
                        rag_context_ids=[ctx.get('id') for ctx in rag_contexts],
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
                        # On final attempt, raise error
                        raise ValidationError(f"Failed to parse XML after {attempt} attempts: {str(parse_error)}")
                
                logger.debug("Parsed flashcards from XML", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "user_id": user_id,
                        "week": week,
                        "attempt": attempt,
                        "parsed_count": len(parsed_flashcards)
                    }
                })
                
                # For each candidate, compute embedding and check similarity
                duplicate_candidates = []
                valid_candidates = []
                similarity_scores_all = []
                
                for i, card_data in enumerate(parsed_flashcards):
                    front_text = card_data.get('front', '').strip()
                    back_text = card_data.get('back', '').strip()
                    
                    if not front_text or not back_text:
                        continue
                    
                    combined_text = f"{front_text} {back_text}"
                    
                    # Compute embedding
                    embedding_vector = service.embedding_service.embed_text(combined_text)
                    
                    # Check for duplicates with details
                    duplicate_check = check_duplicate_with_details(
                        candidate_vector=embedding_vector,
                        user_id=user_id,
                        week=week,
                        content_type='flashcard'
                    )
                    
                    similarity_scores_all.extend(duplicate_check['similarity_scores'])
                    
                    if duplicate_check['is_duplicate']:
                        duplicate_candidates.append({
                            'card_data': card_data,
                            'vector': embedding_vector,
                            'combined_text': combined_text,
                            'check_result': duplicate_check
                        })
                        
                        # Log duplicate rejection activity
                        log_activity(
                            user_id=user_id,
                            activity_type=ACTIVITY_TYPES['DUPLICATE_REJECT'],
                            metadata={
                                "content_type": "flashcard",
                                "week": week,
                                "attempt": attempt,
                                "reason": duplicate_check['reason'],
                                "similarity": duplicate_check['max_similarity'],
                                "card_index": i,
                                "front_text_preview": front_text[:100]
                            }
                        )
                    else:
                        valid_candidates.append({
                            'card_data': card_data,
                            'vector': embedding_vector,
                            'combined_text': combined_text,
                            'check_result': duplicate_check
                        })
                
                # Log LLM attempt
                prompt_hash = hashlib.md5(f"{user_profile}_{rag_contexts}_{num_cards}".encode()).hexdigest()
                log_llm_attempt(
                    user_id=user_id,
                    content_type='flashcard',
                    attempt_number=attempt,
                    week=week,
                    prompt_hash=prompt_hash,
                    raw_response=xml_response,
                    rag_context_ids=[ctx.get('id') for ctx in rag_contexts],
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
                
                # Check if we have sufficient valid candidates
                if len(valid_candidates) < num_cards and attempt < 3:
                    logger.warning("Insufficient valid candidates, regenerating", extra={
                        "extra_fields": {
                            "correlation_id": correlation_id,
                            "user_id": user_id,
                            "week": week,
                            "attempt": attempt,
                            "requested_count": num_cards,
                            "valid_candidates": len(valid_candidates)
                        }
                    })
                    previous_rejections.append(f"Attempt {attempt}: Only {len(valid_candidates)} valid candidates generated, need {num_cards}")
                    continue
                
                # ENFORCE EXACT COUNT: Limit valid candidates to requested number
                candidates_to_create = valid_candidates[:num_cards]
                
                logger.info("Enforcing exact flashcard count", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "user_id": user_id,
                        "week": week,
                        "requested_count": num_cards,
                        "valid_candidates": len(valid_candidates),
                        "will_create": len(candidates_to_create)
                    }
                })
                
                # Persist accepted Flashcards and add to SimilarityIndex
                for candidate in candidates_to_create:
                    try:
                        card_data = candidate['card_data']
                        embedding_vector = candidate['vector']
                        combined_text = candidate['combined_text']
                        
                        # Create flashcard document
                        from models.flashcard import Flashcard
                        flashcard = Flashcard(
                            user_id=user_id,
                            week=week,
                            front_text=card_data['front'],
                            back_text=card_data['back'],
                            xml=xml_response,
                            rag_chunk_ids=[ctx.get('id', '') for ctx in rag_contexts if ctx.get('id')],
                            embedding_vector=embedding_vector,
                            created_at=now_utc()
                        )
                        
                        # Save flashcard
                        flashcard.save()
                        
                        # Add to similarity index
                        text_hash = hashlib.sha256(combined_text.encode()).hexdigest()
                        add_to_index(
                            user_id=user_id,
                            week=week,
                            content_type='flashcard',
                            vector=embedding_vector,
                            text_hash=text_hash
                        )
                        
                        created_flashcards.append(flashcard)
                        
                        logger.debug("Created flashcard", extra={
                            "extra_fields": {
                                "correlation_id": correlation_id,
                                "user_id": user_id,
                                "week": week,
                                "flashcard_id": str(flashcard.id),
                                "attempt": attempt
                            }
                        })
                        
                    except Exception as e:
                        logger.warning("Failed to persist individual flashcard", extra={
                            "extra_fields": {
                                "correlation_id": correlation_id,
                                "user_id": user_id,
                                "week": week,
                                "attempt": attempt,
                                "error": str(e)
                            }
                        })
                        continue
                
                logger.info("Flashcard generation completed successfully", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "user_id": user_id,
                        "week": week,
                        "attempt": attempt,
                        "requested_count": num_cards,
                        "created_count": len(created_flashcards)
                    }
                })
                break
                
            except Exception as e:
                logger.error(f"Flashcard generation attempt {attempt} failed", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "user_id": user_id,
                        "week": week,
                        "attempt": attempt,
                        "error": str(e)
                    }
                })
                
                if attempt == 3:
                    raise ValidationError(f"Flashcard generation failed after {attempt} attempts: {str(e)}")
                else:
                    previous_rejections.append(f"Attempt {attempt} failed: {str(e)}")
                    continue
        
        return created_flashcards
        
    except Exception as e:
        logger.error("Failed to generate flashcards", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "week": week,
                "error": str(e)
            }
        })
        raise
