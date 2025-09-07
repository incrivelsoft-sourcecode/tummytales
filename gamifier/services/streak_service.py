"""
Streak Service for managing user quiz streaks.
Tracks consecutive quiz completion days and updates user game profiles.
"""

from datetime import date, datetime, timedelta
from typing import Dict, Optional

from models.user_game_profile import UserGameProfile
from config.logger import get_logger
from utils.time_utils import now_utc

logger = get_logger(__name__)


def update_on_quiz_completion(user_id: str, completed_date: Optional[date] = None) -> Dict[str, int]:
    """
    Update user streak based on quiz completion.
    
    Args:
        user_id: The user ID to update streaks for
        completed_date: Date of quiz completion (defaults to today)
        
    Returns:
        dict: Updated streak information {current_streak, longest_streak}
        
    Raises:
        Exception: If user profile cannot be updated
    """
    if completed_date is None:
        completed_date = now_utc().date()
    
    correlation_id = f"streak_update_{user_id}_{completed_date.isoformat()}"
    
    logger.info("Updating user streak", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": user_id,
            "completed_date": completed_date.isoformat()
        }
    })
    
    try:
        # Load user profile
        profile = UserGameProfile.objects(user_id=user_id).first()
        if not profile:
            logger.warning("User profile not found for streak update", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id
                }
            })
            return {"current_streak": 0, "longest_streak": 0}
        
        # Calculate new streak
        new_current_streak = 1
        
        if profile.last_quiz_date:
            yesterday = completed_date - timedelta(days=1)
            
            # If last quiz was yesterday, continue streak
            if profile.last_quiz_date.date() == yesterday:
                new_current_streak = profile.current_streak + 1
                logger.info("Continuing streak", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "user_id": user_id,
                        "previous_streak": profile.current_streak,
                        "new_streak": new_current_streak,
                        "last_quiz_date": profile.last_quiz_date.date().isoformat()
                    }
                })
            elif profile.last_quiz_date.date() == completed_date:
                # Same day completion, keep current streak
                new_current_streak = profile.current_streak
                logger.info("Same day quiz completion, maintaining streak", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "user_id": user_id,
                        "current_streak": new_current_streak
                    }
                })
            else:
                # Streak broken, reset to 1
                logger.info("Streak broken, resetting", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "user_id": user_id,
                        "previous_streak": profile.current_streak,
                        "last_quiz_date": profile.last_quiz_date.date().isoformat(),
                        "completed_date": completed_date.isoformat()
                    }
                })
        else:
            logger.info("First quiz completion, starting streak", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id
                }
            })
        
        # Update longest streak if needed
        new_longest_streak = max(profile.longest_streak or 0, new_current_streak)
        
        # Update profile atomically
        profile.update(
            current_streak=new_current_streak,
            longest_streak=new_longest_streak,
            last_quiz_date=datetime.combine(completed_date, datetime.min.time().replace(tzinfo=now_utc().tzinfo))
        )
        
        logger.info("Successfully updated user streak", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "current_streak": new_current_streak,
                "longest_streak": new_longest_streak
            }
        })
        
        return {
            "current_streak": new_current_streak,
            "longest_streak": new_longest_streak
        }
        
    except Exception as e:
        logger.error("Failed to update user streak", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "error": str(e)
            }
        })
        raise


def get_streak(user_id: str) -> Dict[str, int]:
    """
    Get current streak information for a user.
    
    Args:
        user_id: The user ID to get streak for
        
    Returns:
        dict: Streak information {current_streak, longest_streak}
    """
    try:
        profile = UserGameProfile.objects(user_id=user_id).first()
        if not profile:
            return {"current_streak": 0, "longest_streak": 0}
        
        return {
            "current_streak": profile.current_streak or 0,
            "longest_streak": profile.longest_streak or 0
        }
        
    except Exception as e:
        logger.error("Failed to get user streak", extra={
            "extra_fields": {
                "user_id": user_id,
                "error": str(e)
            }
        })
        return {"current_streak": 0, "longest_streak": 0}
