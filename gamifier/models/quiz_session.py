"""
Quiz Session model for tracking quiz game sessions.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
from mongoengine import (
    Document, StringField, IntField, DictField, 
    ListField, DateTimeField, signals
)
from utils.time_utils import now_utc
from utils.constants import SESSION_STATUS, QUIZ_SESSION_MAX_MINUTES
from config.logger import get_logger

logger = get_logger(__name__)


class QuizSession(Document):
    """
    Quiz session document for tracking individual quiz attempts.
    Uses the same 'tummytales' database as other services.
    """
    
    # Core user and session identification
    user_id = StringField(required=True, max_length=255)
    
    # Session configuration
    difficulty_selected = StringField(
        required=True,
        choices=['easy', 'medium', 'hard'],
        max_length=10
    )
    week_at_start = IntField(required=True, min_value=1)
    
    # Session status tracking
    status = StringField(
        required=True,
        choices=[
            SESSION_STATUS["STARTED"],
            SESSION_STATUS["IN_PROGRESS"], 
            SESSION_STATUS["RETRY"],
            SESSION_STATUS["COMPLETED"],
            SESSION_STATUS["TIMED_OUT"],
            SESSION_STATUS["ABANDONED"]
        ],
        default=SESSION_STATUS["STARTED"],
        max_length=15
    )
    
    # Timestamps
    started_at = DateTimeField(required=True, default=now_utc)
    completed_at = DateTimeField()
    timeout_at = DateTimeField(required=True)
    
    # Quiz configuration and results
    total_questions = IntField(required=True, min_value=1)
    score = IntField(default=0, min_value=0)
    awarded_points = IntField(default=0, min_value=0)
    
    # Question data - stores question snapshots for consistency
    questions = ListField(DictField(), default=list)
    
    # Answer tracking - each attempt: {question_id, selected_option, is_correct, answered_at}
    answer_attempts = ListField(DictField(), default=list)
    
    # MongoDB collection settings
    meta = {
        'collection': 'quiz_sessions',  # Match Node.js naming convention
        'db_alias': 'default',
        'indexes': [
            ('user_id', 'started_at'),  # Primary compound index as specified
            'user_id',  # User lookup index
            'status',  # Status filtering
            'started_at',  # Temporal queries
            ('user_id', 'status'),  # User status filtering
        ]
    }
    
    def __str__(self):
        return f"QuizSession(user_id={self.user_id}, status={self.status}, week={self.week_at_start})"
    
    def clean(self):
        """
        Validate session data before saving and set calculated fields.
        """
        try:
            # Set timeout_at if not already set
            if not self.timeout_at and self.started_at:
                # Ensure started_at is timezone-aware before adding timedelta
                started_at = self.started_at
                if started_at.tzinfo is None:
                    started_at = started_at.replace(tzinfo=timezone.utc)
                
                self.timeout_at = started_at + timedelta(minutes=QUIZ_SESSION_MAX_MINUTES)
            
            # Validate score doesn't exceed total questions
            if self.score > self.total_questions:
                raise ValueError(f"Score ({self.score}) cannot exceed total questions ({self.total_questions})")
            
            # Validate status transitions
            if self.status == SESSION_STATUS["COMPLETED"] and not self.completed_at:
                self.completed_at = now_utc()
            
            logger.debug(f"QuizSession validation passed for user {self.user_id}")
            
        except Exception as e:
            logger.error(f"QuizSession validation failed for user {self.user_id}: {str(e)}")
            raise
    
    def is_timed_out(self, now: Optional[datetime] = None) -> bool:
        """
        Check if the session has exceeded its time limit.
        
        Args:
            now: Current time (defaults to now_utc())
            
        Returns:
            bool: True if session is timed out, False otherwise
        """
        try:
            if now is None:
                now = now_utc()
            
            # If already marked as timed out or completed, use that status
            if self.status in [SESSION_STATUS["TIMED_OUT"], SESSION_STATUS["COMPLETED"]]:
                return self.status == SESSION_STATUS["TIMED_OUT"]
            
            # Ensure both datetimes are timezone-aware for comparison
            if now.tzinfo is None:
                now = now.replace(tzinfo=timezone.utc)
            
            timeout_at = self.timeout_at
            if timeout_at.tzinfo is None:
                timeout_at = timeout_at.replace(tzinfo=timezone.utc)
            
            # Check if current time exceeds timeout
            is_expired = now >= timeout_at
            
            logger.debug(f"Session {self.id} timeout check: {is_expired} (now: {now}, timeout_at: {timeout_at})")
            return is_expired
            
        except Exception as e:
            logger.error(f"Failed to check timeout for session {self.id}: {str(e)}")
            return False
    
    def get_remaining_seconds(self, now: Optional[datetime] = None) -> int:
        """
        Calculate remaining seconds before session timeout.
        
        Args:
            now: Current time (defaults to now_utc())
            
        Returns:
            int: Remaining seconds (0 if expired or completed)
        """
        try:
            if now is None:
                now = now_utc()
            
            # If session is completed or timed out, return 0
            if self.status in [SESSION_STATUS["COMPLETED"], SESSION_STATUS["TIMED_OUT"]]:
                return 0
            
            # Ensure both datetimes are timezone-aware for comparison
            if now.tzinfo is None:
                now = now.replace(tzinfo=timezone.utc)
            
            timeout_at = self.timeout_at
            if timeout_at.tzinfo is None:
                timeout_at = timeout_at.replace(tzinfo=timezone.utc)
            
            # Calculate remaining time
            remaining_delta = timeout_at - now
            remaining_seconds = max(0, int(remaining_delta.total_seconds()))
            
            logger.debug(f"Session {self.id} remaining seconds: {remaining_seconds}")
            return remaining_seconds
            
        except Exception as e:
            logger.error(f"Failed to calculate remaining seconds for session {self.id}: {str(e)}")
            return 0
    
    def append_answer_attempt(self, attempt_dict: Dict[str, Any]) -> bool:
        """
        Atomically append an answer attempt to the session.
        
        Args:
            attempt_dict: Dict with keys: question_id, selected_option, is_correct, answered_at
            
        Returns:
            bool: True if successfully added, False otherwise
        """
        try:
            # Validate attempt structure
            required_keys = ['question_id', 'selected_option', 'is_correct', 'answered_at']
            if not all(key in attempt_dict for key in required_keys):
                raise ValueError(f"Answer attempt must contain keys: {required_keys}")
            
            # Ensure answered_at is a datetime
            if not isinstance(attempt_dict['answered_at'], datetime):
                attempt_dict['answered_at'] = now_utc()
            
            # Atomic update to append the attempt
            result = self.update(
                push__answer_attempts=attempt_dict,
                set__status=SESSION_STATUS["IN_PROGRESS"]
            )
            
            # Update local instance
            self.answer_attempts.append(attempt_dict)
            self.status = SESSION_STATUS["IN_PROGRESS"]
            
            logger.info(f"Added answer attempt for session {self.id}, question {attempt_dict['question_id']}")
            return bool(result)
            
        except Exception as e:
            logger.error(f"Failed to append answer attempt for session {self.id}: {str(e)}")
            return False
    
    def finalize_session(self, score: int, awarded_points: int) -> bool:
        """
        Atomically finalize the session with score and points.
        
        Args:
            score: Final score achieved
            awarded_points: Points awarded for this session
            
        Returns:
            bool: True if successfully finalized, False otherwise
        """
        try:
            current_time = now_utc()
            
            # Determine final status based on timeout
            final_status = (
                SESSION_STATUS["TIMED_OUT"] if self.is_timed_out(current_time) 
                else SESSION_STATUS["COMPLETED"]
            )
            
            # Atomic update to finalize session
            result = self.update(
                set__status=final_status,
                set__completed_at=current_time,
                set__score=score,
                set__awarded_points=awarded_points
            )
            
            # Update local instance
            self.status = final_status
            self.completed_at = current_time
            self.score = score
            self.awarded_points = awarded_points
            
            logger.info(f"Finalized session {self.id} with status {final_status}, score {score}, points {awarded_points}")
            return bool(result)
            
        except Exception as e:
            logger.error(f"Failed to finalize session {self.id}: {str(e)}")
            return False
    
    def get_progress_summary(self) -> Dict[str, Any]:
        """
        Get a summary of session progress.
        
        Returns:
            dict: Progress summary with key metrics
        """
        try:
            answered_count = len(self.answer_attempts)
            correct_count = sum(1 for attempt in self.answer_attempts if attempt.get('is_correct', False))
            
            summary = {
                'session_id': str(self.id),
                'user_id': self.user_id,
                'status': self.status,
                'difficulty': self.difficulty_selected,
                'week': self.week_at_start,
                'total_questions': self.total_questions,
                'answered_count': answered_count,
                'correct_count': correct_count,
                'score': self.score,
                'awarded_points': self.awarded_points,
                'remaining_seconds': self.get_remaining_seconds(),
                'started_at': self.started_at.isoformat() if self.started_at else None,
                'completed_at': self.completed_at.isoformat() if self.completed_at else None,
                'is_timed_out': self.is_timed_out()
            }
            
            logger.debug(f"Generated progress summary for session {self.id}")
            return summary
            
        except Exception as e:
            logger.error(f"Failed to generate progress summary for session {self.id}: {str(e)}")
            return {}
    
    @classmethod
    def create_new_session(cls, user_id: str, difficulty: str, week: int, 
                          questions: List[Dict[str, Any]]) -> Optional['QuizSession']:
        """
        Create a new quiz session with provided questions.
        
        Args:
            user_id: User identifier
            difficulty: Selected difficulty level
            week: Week number at session start
            questions: List of question snapshot dictionaries
            
        Returns:
            QuizSession: New session instance or None if creation failed
        """
        try:
            current_time = now_utc()
            timeout_time = current_time + timedelta(minutes=QUIZ_SESSION_MAX_MINUTES)
            
            session_data = {
                'user_id': user_id,
                'difficulty_selected': difficulty,
                'week_at_start': week,
                'status': SESSION_STATUS["STARTED"],
                'started_at': current_time,
                'timeout_at': timeout_time,
                'total_questions': len(questions),
                'questions': questions,
                'score': 0,
                'awarded_points': 0,
                'answer_attempts': []
            }
            
            session = cls(**session_data)
            session.save()
            
            logger.info(f"Created new quiz session {session.id} for user {user_id}")
            return session
            
        except Exception as e:
            logger.error(f"Failed to create new session for user {user_id}: {str(e)}")
            return None


# Signal handlers for automatic timestamp updates
@signals.pre_save.connect
def update_quiz_session_timestamps(sender, document, **kwargs):
    """Update calculated fields before saving."""
    if isinstance(document, QuizSession):
        # Ensure timeout_at is set if missing
        if not document.timeout_at and document.started_at:
            # Ensure started_at is timezone-aware before adding timedelta
            started_at = document.started_at
            if started_at.tzinfo is None:
                started_at = started_at.replace(tzinfo=timezone.utc)
            
            document.timeout_at = started_at + timedelta(minutes=QUIZ_SESSION_MAX_MINUTES)
