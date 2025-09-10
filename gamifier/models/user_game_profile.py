"""
User Game Profile model for gamification features.
"""

from datetime import datetime
from typing import Dict, List, Optional
from mongoengine import (
    Document, StringField, IntField, DictField, 
    ListField, DateTimeField, signals
)
from utils.time_utils import now_utc, reset_limits_if_needed
from utils.constants import MAX_QUIZZES_PER_DAY, FLASHCARD_FLIPS_PER_DAY
from config.logger import get_logger

logger = get_logger(__name__)


class UserGameProfile(Document):
    """
    User game profile document for tracking gamification progress.
    Uses the same 'tummytales' database as other services.
    """
    
    # Core user identification
    user_id = StringField(required=True, unique=True, max_length=255)
    
    # User preferences
    timezone = StringField(default="America/Chicago", max_length=50)
    
    # Game progression
    current_week = IntField(default=1, min_value=1)
    
    # Points tracking
    points = DictField(default=dict)
    
    # Daily limits tracking
    limits = DictField(default=dict)
    
    # Streak tracking
    current_streak = IntField(default=0, min_value=0)
    longest_streak = IntField(default=0, min_value=0)
    last_quiz_date = DateTimeField()
    
    # Achievements
    badges = ListField(StringField(max_length=50), default=list)
    
    # Timestamps
    created_at = DateTimeField(default=now_utc)
    updated_at = DateTimeField(default=now_utc)
    
    # MongoDB collection settings
    meta = {
        'collection': 'usergameprofiles',  # Match Node.js naming convention
        'db_alias': 'default',
        'indexes': [
            'user_id',  # Primary lookup index
            ('user_id', 'current_week'),  # Compound index for weekly data
            'updated_at',  # For cleanup queries
        ]
    }
    
    def __str__(self):
        return f"UserGameProfile(user_id={self.user_id}, week={self.current_week})"
    
    def increment_points(self, delta: int) -> None:
        """
        Atomically increment user points.
        
        Args:
            delta: Points to add (can be negative)
        """
        try:
            # Ensure limits are up to date
            self.refresh_limits_if_needed()
            
            # Update points atomically
            self.update(
                inc__points__lifetime=delta,
                inc__points__today=delta,
                set__updated_at=now_utc()
            )
            
            # Update local instance
            if not isinstance(self.points, dict):
                self.points = {"lifetime": 0, "today": 0}
            
            self.points["lifetime"] = self.points.get("lifetime", 0) + delta
            self.points["today"] = self.points.get("today", 0) + delta
            self.updated_at = now_utc()
            
            logger.debug(f"Incremented points for user {self.user_id} by {delta}")
            
        except Exception as e:
            logger.error(f"Failed to increment points for user {self.user_id}: {str(e)}")
            raise
    
    def increment_quizzes_today(self) -> None:
        """
        Atomically increment today's quiz count.
        
        Raises:
            ValueError: If daily limit exceeded
        """
        try:
            # Ensure limits are up to date
            self.refresh_limits_if_needed()
            
            current_count = self.limits.get("quizzes_today", 0)
            if current_count >= MAX_QUIZZES_PER_DAY:
                raise ValueError(f"Daily quiz limit of {MAX_QUIZZES_PER_DAY} reached")
            
            # Update count atomically
            self.update(
                inc__limits__quizzes_today=1,
                set__updated_at=now_utc()
            )
            
            # Update local instance
            if not isinstance(self.limits, dict):
                self.limits = {"quizzes_today": 0, "flips_today": 0}
            
            self.limits["quizzes_today"] = current_count + 1
            self.updated_at = now_utc()
            
            logger.debug(f"Incremented quiz count for user {self.user_id}")
            
        except Exception as e:
            logger.error(f"Failed to increment quiz count for user {self.user_id}: {str(e)}")
            raise
    
    def increment_flips_today(self) -> None:
        """
        Atomically increment today's flashcard flip count.
        
        Raises:
            ValueError: If daily limit exceeded
        """
        try:
            # Ensure limits are up to date
            self.refresh_limits_if_needed()
            
            current_count = self.limits.get("flips_today", 0)
            if current_count >= FLASHCARD_FLIPS_PER_DAY:
                raise ValueError(f"Daily flashcard limit of {FLASHCARD_FLIPS_PER_DAY} reached")
            
            # Update count atomically
            self.update(
                inc__limits__flips_today=1,
                set__updated_at=now_utc()
            )
            
            # Update local instance
            if not isinstance(self.limits, dict):
                self.limits = {"quizzes_today": 0, "flips_today": 0}
            
            self.limits["flips_today"] = current_count + 1
            self.updated_at = now_utc()
            
            logger.debug(f"Incremented flip count for user {self.user_id}")
            
        except Exception as e:
            logger.error(f"Failed to increment flip count for user {self.user_id}: {str(e)}")
            raise
    
    def refresh_limits_if_needed(self) -> bool:
        """
        Check and reset daily limits if needed.
        
        Returns:
            bool: True if limits were reset, False otherwise
        """
        try:
            was_reset = reset_limits_if_needed(self)
            
            if was_reset:
                # Save the updated limits to database
                self.update(
                    set__limits=self.limits,
                    set__points__today=0,
                    set__updated_at=now_utc()
                )
                logger.info(f"Reset daily limits for user {self.user_id}")
            
            return was_reset
            
        except Exception as e:
            logger.error(f"Failed to refresh limits for user {self.user_id}: {str(e)}")
            return False
    
    def update_streak(self, quiz_completed: bool = True) -> None:
        """
        Update user's quiz streak.
        
        Args:
            quiz_completed: Whether a quiz was completed today
        """
        try:
            current_time = now_utc()
            
            if quiz_completed:
                # Check if this is a new day
                if (not self.last_quiz_date or 
                    not self._is_consecutive_day(self.last_quiz_date, current_time)):
                    
                    if self._is_next_day(self.last_quiz_date, current_time):
                        # Consecutive day - increment streak
                        self.current_streak += 1
                    else:
                        # Streak broken - reset
                        self.current_streak = 1
                    
                    # Update longest streak if needed
                    if self.current_streak > self.longest_streak:
                        self.longest_streak = self.current_streak
                    
                    self.last_quiz_date = current_time
                    
                    # Save to database
                    self.update(
                        set__current_streak=self.current_streak,
                        set__longest_streak=self.longest_streak,
                        set__last_quiz_date=self.last_quiz_date,
                        set__updated_at=current_time
                    )
                    
                    logger.debug(f"Updated streak for user {self.user_id}: {self.current_streak}")
            
        except Exception as e:
            logger.error(f"Failed to update streak for user {self.user_id}: {str(e)}")
    
    def add_badge(self, badge_name: str) -> bool:
        """
        Add a badge to user's collection if not already present.
        
        Args:
            badge_name: Name of badge to add
            
        Returns:
            bool: True if badge was added, False if already present
        """
        try:
            if badge_name not in self.badges:
                self.update(
                    add_to_set__badges=badge_name,
                    set__updated_at=now_utc()
                )
                self.badges.append(badge_name)
                logger.info(f"Added badge '{badge_name}' to user {self.user_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to add badge for user {self.user_id}: {str(e)}")
            return False
    
    def _is_consecutive_day(self, last_date: datetime, current_date: datetime) -> bool:
        """Check if two dates are on consecutive days."""
        from utils.time_utils import days_between
        return abs(days_between(last_date, current_date)) <= 1
    
    def _is_next_day(self, last_date: datetime, current_date: datetime) -> bool:
        """Check if current date is the day after last date."""
        from utils.time_utils import days_between
        return days_between(last_date, current_date) == 1
    
    @classmethod
    def get_or_create_profile(cls, user_id: str, **kwargs) -> 'UserGameProfile':
        """
        Get existing user profile or create a new one.
        
        Args:
            user_id: User identifier
            **kwargs: Additional fields for profile creation
            
        Returns:
            UserGameProfile: User's game profile
        """
        try:
            # Try to get existing profile
            profile = cls.objects(user_id=user_id).first()
            
            if profile:
                # Ensure limits are current
                profile.refresh_limits_if_needed()
                logger.debug(f"Retrieved existing profile for user {user_id}")
                return profile
            
            # Create new profile
            profile_data = {
                'user_id': user_id,
                'timezone': kwargs.get('timezone', 'America/Chicago'),
                'current_week': kwargs.get('current_week', 1),
                **kwargs
            }
            
            profile = cls(**profile_data)
            profile.save()
            
            logger.info(f"Created new profile for user {user_id}")
            return profile
            
        except Exception as e:
            logger.error(f"Failed to get/create profile for user {user_id}: {str(e)}")
            raise


# Signal handlers for automatic timestamp updates
@signals.pre_save.connect
def update_modified(sender, document, **kwargs):
    """Update the updated_at timestamp and initialize dict fields before saving."""
    if isinstance(document, UserGameProfile):
        document.updated_at = now_utc()
        
        # Initialize dict fields if they are None or empty
        if not document.points:
            document.points = {"lifetime": 0, "today": 0}
        
        if not document.limits:
            document.limits = {
                "quizzes_today": 0,
                "flips_today": 0,
                "last_reset_at": now_utc()
            }
