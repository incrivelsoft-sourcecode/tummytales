"""
Activity Log model for tracking user activities and events.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from mongoengine import (
    Document, StringField, DateTimeField, DictField, IntField
)
from utils.time_utils import now_utc
from config.logger import get_logger

logger = get_logger(__name__)

# Activity type constants
ACTIVITY_TYPES = {
    'QUIZ_START': 'quiz_start',
    'QUIZ_COMPLETE': 'quiz_complete',
    'ANSWER': 'answer',
    'FLASHCARD_FLIP': 'flashcard_flip',
    'DAILY_LOGIN': 'daily_login',
    'BADGE_AWARD': 'badge_award',
    'LIMIT_BLOCKED': 'limit_blocked',
    'DUPLICATE_REJECT': 'duplicate_reject',
    'TIMED_OUT': 'timed_out',
}


class ActivityLog(Document):
    """
    Activity log document for tracking all user activities and events.
    Used for analytics, debugging, and audit trails.
    Uses the same 'tummytales' database as other services.
    """
    
    # Core user identification
    user_id = StringField(required=True, max_length=255)
    
    # Activity type - using specific enum values as required
    type = StringField(
        required=True,
        choices=[
            ACTIVITY_TYPES['QUIZ_START'],
            ACTIVITY_TYPES['QUIZ_COMPLETE'],
            ACTIVITY_TYPES['ANSWER'],
            ACTIVITY_TYPES['FLASHCARD_FLIP'],
            ACTIVITY_TYPES['DAILY_LOGIN'],
            ACTIVITY_TYPES['BADGE_AWARD'],
            ACTIVITY_TYPES['LIMIT_BLOCKED'],
            ACTIVITY_TYPES['DUPLICATE_REJECT'],
            ACTIVITY_TYPES['TIMED_OUT'],
        ],
        max_length=20
    )
    
    # Timestamp with default to current time
    ts = DateTimeField(required=True, default=now_utc)
    
    # Flexible metadata storage for activity-specific data
    details = DictField(default=dict)  # Renamed from metadata to avoid conflict
    
    # Points change associated with this activity
    points_delta = IntField(default=0)
    
    # MongoDB collection settings
    meta = {  # Changed from 'metadata' to 'meta' to avoid field name conflict
        'collection': 'activity_logs',  # Match Node.js naming convention
        'db_alias': 'default',
        'indexes': [
            'user_id',  # Primary user lookup index
            'ts',  # Temporal queries index
            ('user_id', 'ts'),  # Compound index for user activity timeline
            ('user_id', 'type'),  # User activity type filtering
            'type',  # Activity type analytics
            ('user_id', 'type', 'ts'),  # Comprehensive user activity queries
        ]
    }
    
    def __str__(self):
        return f"ActivityLog(user_id={self.user_id}, type={self.type}, ts={self.ts}, points_delta={self.points_delta})"
    
    @property
    def created_at(self):
        """Alias for ts field to maintain compatibility with test code."""
        return self.ts
    
    @created_at.setter
    def created_at(self, value):
        """Allow setting via created_at alias."""
        self.ts = value
    
    def clean(self):
        """
        Validate activity log data before saving.
        """
        try:
            # Ensure timestamp is set
            if not self.ts:
                self.ts = now_utc()
            
            # Validate points_delta is reasonable (prevent abuse)
            if abs(self.points_delta) > 10000:
                logger.warning(f"Large points_delta detected: {self.points_delta} for user {self.user_id}")
            
            # Ensure details is a dict
            if self.details is None:
                self.details = {}
            
            logger.debug(f"ActivityLog validation passed for user {self.user_id}, type {self.type}")
            
        except Exception as e:
            logger.error(f"ActivityLog validation failed for user {self.user_id}, type {self.type}: {str(e)}")
            raise
    
    def to_dict(self) -> dict:
        """
        Convert ActivityLog to API-safe dictionary representation.
        
        Returns:
            dict: Activity log data suitable for API responses
        """
        try:
            return {
                'id': str(self.id),
                'user_id': self.user_id,
                'type': self.type,
                'ts': self.ts.isoformat() if self.ts else None,
                'metadata': self.details or {},  # Keep API field name as 'metadata' for compatibility
                'points_delta': self.points_delta,
            }
        except Exception as e:
            logger.error(f"Failed to convert ActivityLog {self.id} to dict: {str(e)}")
            raise
    
    @classmethod
    def get_user_activities(cls, user_id: str, activity_type: Optional[str] = None, 
                           limit: int = 100, skip: int = 0) -> list:
        """
        Get activities for a specific user, optionally filtered by type.
        
        Args:
            user_id: The user ID to fetch activities for
            activity_type: Optional activity type filter
            limit: Maximum number of activities to return
            skip: Number of activities to skip (for pagination)
            
        Returns:
            list: List of ActivityLog documents
        """
        try:
            query = cls.objects(user_id=user_id)
            
            if activity_type:
                query = query.filter(type=activity_type)
            
            activities = query.order_by('-ts').skip(skip).limit(limit)
            
            logger.debug(f"Retrieved {len(activities)} activities for user {user_id}, type {activity_type}")
            return list(activities)
            
        except Exception as e:
            logger.error(f"Failed to retrieve activities for user {user_id}: {str(e)}")
            return []
    
    @classmethod
    def get_recent_activities(cls, user_id: str, hours: int = 24) -> list:
        """
        Get recent activities for a user within the specified time window.
        
        Args:
            user_id: The user ID to fetch activities for
            hours: Number of hours to look back
            
        Returns:
            list: List of recent ActivityLog documents
        """
        try:
            from datetime import timedelta
            cutoff_time = now_utc() - timedelta(hours=hours)
            
            activities = cls.objects(
                user_id=user_id,
                ts__gte=cutoff_time
            ).order_by('-ts')
            
            logger.debug(f"Retrieved {len(activities)} recent activities for user {user_id} in last {hours} hours")
            return list(activities)
            
        except Exception as e:
            logger.error(f"Failed to retrieve recent activities for user {user_id}: {str(e)}")
            return []


def log_activity(user_id: str, activity_type: str, metadata: Optional[Dict[str, Any]] = None, 
                points_delta: int = 0, session_id: Optional[str] = None, 
                question_id: Optional[str] = None, attempt_index: Optional[int] = None,
                similarity_score: Optional[float] = None, rag_context_ids: Optional[List[str]] = None,
                points_preview: Optional[int] = None) -> bool:
    """
    Enhanced helper function to log an activity for a user with rich metadata.
    
    Args:
        user_id: The user ID
        activity_type: The type of activity (must be one of ACTIVITY_TYPES values)
        metadata: Optional metadata dictionary
        points_delta: Points change associated with this activity (default: 0)
        session_id: Quiz/flashcard session ID (for answer activities)
        question_id: Question ID (for answer activities)
        attempt_index: Attempt number within a question (for retry scenarios)
        similarity_score: Similarity score for duplicate detection activities
        rag_context_ids: List of RAG context IDs used in generation
        points_preview: Preview points shown before completion
        
    Returns:
        bool: True if successfully logged, False otherwise
    """
    try:
        # Validate activity type
        valid_types = list(ACTIVITY_TYPES.values())
        if activity_type not in valid_types:
            raise ValueError(f"Invalid activity type: {activity_type}. Must be one of: {valid_types}")
        
        # Prepare enhanced metadata
        enhanced_metadata = metadata.copy() if metadata else {}
        
        # Add standard fields if provided
        if session_id:
            enhanced_metadata['session_id'] = session_id
        if question_id:
            enhanced_metadata['question_id'] = question_id
        if attempt_index is not None:
            enhanced_metadata['attempt_index'] = attempt_index
        if similarity_score is not None:
            enhanced_metadata['similarity_score'] = similarity_score
        if rag_context_ids:
            enhanced_metadata['rag_context_ids'] = rag_context_ids
        if points_preview is not None:
            enhanced_metadata['points_preview'] = points_preview
        if points_delta != 0:
            enhanced_metadata['points_delta'] = points_delta
            
        # Add timestamp for reference
        enhanced_metadata['logged_at'] = now_utc().isoformat()
        
        # Create and save the activity log
        activity_log = ActivityLog(
            user_id=user_id,
            type=activity_type,
            ts=now_utc(),
            details=enhanced_metadata,
            points_delta=points_delta
        )
        
        activity_log.save()
        
        logger.info("Logged enhanced activity", extra={
            "extra_fields": {
                "user_id": user_id,
                "activity_type": activity_type,
                "points_delta": points_delta,
                "session_id": session_id,
                "question_id": question_id,
                "attempt_index": attempt_index
            }
        })
        return True
        
    except Exception as e:
        logger.error("Failed to log enhanced activity", extra={
            "extra_fields": {
                "user_id": user_id,
                "activity_type": activity_type,
                "error": str(e)
            }
        })
        return False


def log_quiz_start(user_id: str, session_id: str, difficulty: str, week: int) -> bool:
    """
    Convenience function to log quiz start activity.
    
    Args:
        user_id: The user ID
        session_id: The quiz session ID
        difficulty: The quiz difficulty
        week: The pregnancy week
        
    Returns:
        bool: True if successfully logged, False otherwise
    """
    metadata = {
        'session_id': session_id,
        'difficulty': difficulty,
        'week': week,
    }
    return log_activity(user_id, ACTIVITY_TYPES['QUIZ_START'], metadata=metadata)


def log_quiz_complete(user_id: str, session_id: str, score: int, awarded_points: int) -> bool:
    """
    Convenience function to log quiz completion activity.
    
    Args:
        user_id: The user ID
        session_id: The quiz session ID
        score: The final score
        awarded_points: Points awarded for completion
        
    Returns:
        bool: True if successfully logged, False otherwise
    """
    metadata = {
        'session_id': session_id,
        'score': score,
    }
    return log_activity(user_id, ACTIVITY_TYPES['QUIZ_COMPLETE'], metadata=metadata, points_delta=awarded_points)


def log_answer_attempt(user_id: str, session_id: str, question_id: str, 
                      selected_option: str, is_correct: bool, retry_index: int) -> bool:
    """
    Convenience function to log answer attempt activity.
    
    Args:
        user_id: The user ID
        session_id: The quiz session ID
        question_id: The question ID
        selected_option: The selected option (A, B, C, D)
        is_correct: Whether the answer was correct
        retry_index: The retry attempt index
        
    Returns:
        bool: True if successfully logged, False otherwise
    """
    metadata = {
        'session_id': session_id,
        'question_id': question_id,
        'selected_option': selected_option,
        'is_correct': is_correct,
        'retry_index': retry_index,
    }
    return log_activity(user_id, ACTIVITY_TYPES['ANSWER'], metadata=metadata)


def log_flashcard_flip(user_id: str, flashcard_id: str, points_awarded: int) -> bool:
    """
    Convenience function to log flashcard flip activity.
    
    Args:
        user_id: The user ID
        flashcard_id: The flashcard ID
        points_awarded: Points awarded for the flip
        
    Returns:
        bool: True if successfully logged, False otherwise
    """
    metadata = {
        'flashcard_id': flashcard_id,
    }
    return log_activity(user_id, ACTIVITY_TYPES['FLASHCARD_FLIP'], metadata=metadata, points_delta=points_awarded)


def log_badge_award(user_id: str, badge_code: str) -> bool:
    """
    Convenience function to log badge award activity.
    
    Args:
        user_id: The user ID
        badge_code: The badge code that was awarded
        
    Returns:
        bool: True if successfully logged, False otherwise
    """
    metadata = {
        'badge_code': badge_code,
    }
    return log_activity(user_id, ACTIVITY_TYPES['BADGE_AWARD'], metadata=metadata)


def log_limit_blocked(user_id: str, limit_type: str, current_count: int, max_allowed: int) -> bool:
    """
    Convenience function to log limit blocked activity.
    
    Args:
        user_id: The user ID
        limit_type: The type of limit that was hit (e.g., 'quiz', 'flashcard')
        current_count: Current usage count
        max_allowed: Maximum allowed count
        
    Returns:
        bool: True if successfully logged, False otherwise
    """
    metadata = {
        'limit_type': limit_type,
        'current_count': current_count,
        'max_allowed': max_allowed,
    }
    return log_activity(user_id, ACTIVITY_TYPES['LIMIT_BLOCKED'], metadata=metadata)


def log_duplicate_reject(user_id: str, content_type: str, similarity_score: float, 
                        attempt_number: int) -> bool:
    """
    Convenience function to log duplicate content rejection activity.
    
    Args:
        user_id: The user ID
        content_type: The type of content (e.g., 'quiz', 'flashcard')
        similarity_score: The similarity score that triggered rejection
        attempt_number: The generation attempt number
        
    Returns:
        bool: True if successfully logged, False otherwise
    """
    metadata = {
        'content_type': content_type,
        'similarity_score': similarity_score,
        'attempt_number': attempt_number,
    }
    return log_activity(user_id, ACTIVITY_TYPES['DUPLICATE_REJECT'], metadata=metadata)


def log_quiz_timeout(user_id: str, session_id: str, questions_answered: int, 
                    total_questions: int) -> bool:
    """
    Convenience function to log quiz timeout activity.
    
    Args:
        user_id: The user ID
        session_id: The quiz session ID that timed out
        questions_answered: Number of questions answered before timeout
        total_questions: Total number of questions in the session
        
    Returns:
        bool: True if successfully logged, False otherwise
    """
    metadata = {
        'session_id': session_id,
        'questions_answered': questions_answered,
        'total_questions': total_questions,
        'completion_percentage': (questions_answered / total_questions) * 100 if total_questions > 0 else 0
    }
    return log_activity(user_id, ACTIVITY_TYPES['TIMED_OUT'], metadata=metadata)
