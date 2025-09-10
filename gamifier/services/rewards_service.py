"""
Rewards Service for managing user badges and achievements.
Handles badge eligibility checking and awarding.
"""

from datetime import date, datetime, timedelta
from typing import List, Dict, Optional, Any

from models.user_game_profile import UserGameProfile
from models.quiz_session import QuizSession
from models.achievement import Achievement
from models.activity_log import ActivityLog, ACTIVITY_TYPES, log_activity
from config.logger import get_logger
from utils.time_utils import now_utc
from utils.constants import SESSION_STATUS

logger = get_logger(__name__)


def award_badges_if_eligible(user_id: str, completed_date: Optional[date] = None) -> List[str]:
    """
    Check badge eligibility and award badges after quiz completion.
    
    Args:
        user_id: The user ID to check badges for
        completed_date: Date of quiz completion (defaults to today)
        
    Returns:
        List[str]: List of badge codes awarded in this call
    """
    if completed_date is None:
        completed_date = now_utc().date()
    
    correlation_id = f"badge_check_{user_id}_{completed_date.isoformat()}"
    
    logger.info("Checking badge eligibility", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": user_id,
            "completed_date": completed_date.isoformat()
        }
    })
    
    awarded_badges = []
    
    try:
        # Load user profile
        profile = UserGameProfile.objects(user_id=user_id).first()
        if not profile:
            logger.warning("User profile not found for badge check", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id
                }
            })
            return awarded_badges
        
        # Check weekly streak badge (7 consecutive days)
        weekly_badge = _check_weekly_streak_badge(user_id, completed_date, profile, correlation_id)
        if weekly_badge:
            awarded_badges.append(weekly_badge)
        
        # Check other badges (can be extended)
        # TODO: Implement other badge types like quiz_master, perfect_score, etc.
        
        logger.info("Badge eligibility check completed", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "badges_awarded": awarded_badges,
                "badges_count": len(awarded_badges)
            }
        })
        
        return awarded_badges
        
    except Exception as e:
        logger.error("Failed to check badge eligibility", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "error": str(e)
            }
        })
        return awarded_badges


def grant_badge(user_id: str, badge_code: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
    """
    Grant a specific badge to a user.
    Creates Achievement if missing and adds to user's badges.
    
    Args:
        user_id: The user ID to grant badge to
        badge_code: The badge code to grant
        metadata: Optional metadata for the badge
        
    Returns:
        bool: True if badge was granted, False if already had it
    """
    correlation_id = f"grant_badge_{user_id}_{badge_code}"
    
    logger.info("Granting badge to user", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": user_id,
            "badge_code": badge_code,
            "metadata": metadata
        }
    })
    
    try:
        # Step 1: Ensure Achievement exists
        achievement = Achievement.objects(code=badge_code).first()
        if not achievement:
            # Create Achievement if it doesn't exist
            achievement_name, achievement_desc = _generate_achievement_details(badge_code, metadata)
            
            try:
                achievement = Achievement(
                    code=badge_code,
                    name=achievement_name,
                    description=achievement_desc,
                    created_at=now_utc()
                )
                achievement.save()
                
                logger.info("Created new achievement", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "badge_code": badge_code,
                        "achievement_name": achievement_name
                    }
                })
                
            except Exception as e:
                logger.error("Failed to create achievement", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "badge_code": badge_code,
                        "error": str(e)
                    }
                })
                # Continue with badge grant even if achievement creation fails
        
        # Step 2: Load user profile
        profile = UserGameProfile.objects(user_id=user_id).first()
        if not profile:
            logger.warning("User profile not found for badge grant", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id,
                    "badge_code": badge_code
                }
            })
            return False
        
        # Step 3: Check if user already has this badge
        if badge_code in (profile.badges or []):
            logger.info("User already has badge", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id,
                    "badge_code": badge_code
                }
            })
            return False
        
        # Step 4: Add badge to user profile atomically
        profile.update(add_to_set__badges=badge_code)
        
        # Step 5: Log badge award activity
        log_activity(
            user_id=user_id,
            activity_type=ACTIVITY_TYPES['BADGE_AWARD'],
            metadata={
                "badge_code": badge_code,
                "metadata": metadata or {},
                "correlation_id": correlation_id
            }
        )
        
        logger.info("Successfully granted badge", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "badge_code": badge_code
            }
        })
        
        return True
        
    except Exception as e:
        logger.error("Failed to grant badge", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "badge_code": badge_code,
                "error": str(e)
            }
        })
        return False


def _generate_achievement_details(badge_code: str, metadata: Optional[Dict[str, Any]] = None) -> tuple[str, str]:
    """
    Generate achievement name and description based on badge code.
    
    Args:
        badge_code: The badge code to generate details for
        metadata: Optional metadata for context
        
    Returns:
        tuple: (name, description) for the achievement
    """
    try:
        # Handle weekly streak badges
        if badge_code.startswith("WEEKLY_STREAK_"):
            parts = badge_code.split("_")
            if len(parts) >= 4:
                year = parts[2]
                week = parts[3]
                return (
                    f"Weekly Streak {year} {week}",
                    f"Completed at least one quiz every day for 7 consecutive days during {week} of {year}"
                )
        
        # Handle other common badge patterns
        badge_patterns = {
            "FIRST_QUIZ": ("First Quiz", "Completed your first quiz"),
            "QUIZ_MASTER": ("Quiz Master", "Completed 10 quizzes"),
            "PERFECT_SCORE": ("Perfect Score", "Achieved 100% on a quiz"),
            "FLASHCARD_HERO": ("Flashcard Hero", "Completed 50 flashcards"),
            "EARLY_BIRD": ("Early Bird", "Completed a quiz before 9 AM"),
            "NIGHT_OWL": ("Night Owl", "Completed a quiz after 9 PM"),
            "CONSISTENT": ("Consistent Learner", "Completed quizzes 5 days in a row"),
            "EXPLORER": ("Explorer", "Tried all difficulty levels"),
        }
        
        # Find matching pattern
        for pattern, (name, desc) in badge_patterns.items():
            if badge_code.startswith(pattern):
                return (name, desc)
        
        # Default fallback
        formatted_name = badge_code.replace("_", " ").title()
        return (formatted_name, f"Achievement: {formatted_name}")
        
    except Exception as e:
        logger.warning(f"Failed to generate achievement details for {badge_code}: {e}")
        # Fallback to basic formatting
        formatted_name = badge_code.replace("_", " ").title()
        return (formatted_name, f"Achievement: {formatted_name}")


def list_badges(user_id: str) -> List[str]:
    """
    Get list of badges for a user.
    Returns UserGameProfile.badges.
    
    Args:
        user_id: The user ID to get badges for
        
    Returns:
        List[str]: List of badge codes the user has
    """
    correlation_id = f"list_badges_{user_id}"
    
    logger.debug("Listing user badges", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": user_id
        }
    })
    
    try:
        profile = UserGameProfile.objects(user_id=user_id).first()
        if not profile:
            logger.info("User profile not found", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id
                }
            })
            return []
        
        badges = profile.badges or []
        
        logger.debug("Retrieved user badges", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "badge_count": len(badges)
            }
        })
        
        return badges
        
    except Exception as e:
        logger.error("Failed to list user badges", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "error": str(e)
            }
        })
        return []


def _check_weekly_streak_badge(user_id: str, completed_date: date, profile: UserGameProfile, correlation_id: str) -> Optional[str]:
    """
    Check if user is eligible for weekly streak badge.
    
    Args:
        user_id: The user ID
        completed_date: Date of completion
        profile: User game profile
        correlation_id: Correlation ID for tracking
        
    Returns:
        str or None: Badge code if awarded, None otherwise
    """
    try:
        # Calculate 7-day range ending on completed_date
        start_date = completed_date - timedelta(days=6)  # 7 days total including completed_date
        end_date = completed_date
        
        # Create week identifier for badge code
        year = completed_date.year
        week_num = completed_date.isocalendar()[1]
        badge_code = f"WEEKLY_STREAK_{year}_W{week_num:02d}"
        
        # Check if user already has this badge
        if badge_code in (profile.badges or []):
            logger.debug("User already has weekly streak badge", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id,
                    "badge_code": badge_code
                }
            })
            return None
        
        # Query for completed quizzes in the 7-day range
        start_datetime = datetime.combine(start_date, datetime.min.time().replace(tzinfo=now_utc().tzinfo))
        end_datetime = datetime.combine(end_date, datetime.max.time().replace(tzinfo=now_utc().tzinfo))
        
        quiz_sessions = QuizSession.objects(
            user_id=user_id,
            status=SESSION_STATUS["COMPLETED"],
            completed_at__gte=start_datetime,
            completed_at__lte=end_datetime
        )
        
        # Group by date to check if each day has at least one quiz
        quiz_dates = set()
        for session in quiz_sessions:
            if session.completed_at:
                quiz_dates.add(session.completed_at.date())
        
        # Check if all 7 days have at least one completed quiz
        required_dates = {start_date + timedelta(days=i) for i in range(7)}
        
        if required_dates.issubset(quiz_dates):
            # Award weekly streak badge
            if grant_badge(user_id, badge_code, {
                "week_start": start_date.isoformat(),
                "week_end": end_date.isoformat(),
                "quiz_count": len(quiz_sessions)
            }):
                logger.info("Awarded weekly streak badge", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "user_id": user_id,
                        "badge_code": badge_code,
                        "quiz_dates": [d.isoformat() for d in sorted(quiz_dates)],
                        "required_dates": [d.isoformat() for d in sorted(required_dates)]
                    }
                })
                return badge_code
        else:
            missing_dates = required_dates - quiz_dates
            logger.debug("Weekly streak badge not eligible", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id,
                    "badge_code": badge_code,
                    "quiz_dates": [d.isoformat() for d in sorted(quiz_dates)],
                    "missing_dates": [d.isoformat() for d in sorted(missing_dates)]
                }
            })
        
        return None
        
    except Exception as e:
        logger.error("Failed to check weekly streak badge", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "error": str(e)
            }
        })
        return None
