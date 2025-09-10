"""
Answer model for tracking individual quiz answer attempts.
"""

from datetime import datetime
from typing import Optional
from mongoengine import (
    Document, StringField, BooleanField, IntField, DateTimeField, FloatField
)
from utils.time_utils import now_utc
from config.logger import get_logger

logger = get_logger(__name__)


class Answer(Document):
    """
    Answer document for tracking individual answer attempts within quiz sessions.
    Each answer represents one attempt at answering a specific question.
    Uses the same 'tummytales' database as other services.
    """
    
    # Reference to the quiz session (ObjectId as string)
    session_id = StringField(required=True, max_length=255)
    
    # Reference to the question (ObjectId as string)
    question_id = StringField(required=True, max_length=255)
    
    # User's selected option (A, B, C, or D)
    selected_option = StringField(
        required=True,
        choices=['A', 'B', 'C', 'D'],
        max_length=1
    )
    
    # Whether the answer was correct
    is_correct = BooleanField(required=True)
    
    # Retry attempt index (0 for first attempt, 1 for first retry, etc.)
    retry_index = IntField(required=True, default=0, min_value=0)
    
    # When the user started answering this question
    started_at = DateTimeField(required=True)
    
    # When the user submitted their answer
    answered_at = DateTimeField(required=True, default=now_utc)
    
    # Time taken to answer in seconds (auto-calculated)
    time_taken_seconds = FloatField(required=True, min_value=0.0)
    
    # MongoDB collection settings
    meta = {
        'collection': 'answers',  # Match Node.js naming convention
        'db_alias': 'default',
        'indexes': [
            ('session_id', 'question_id'),  # Primary compound index as specified
            'session_id',  # Session lookup index
            'question_id',  # Question analysis queries
            'answered_at',  # Temporal queries
            ('session_id', 'retry_index'),  # Retry analysis
        ]
    }
    
    def __str__(self):
        return f"Answer(session_id={self.session_id}, question_id={self.question_id}, selected={self.selected_option}, correct={self.is_correct})"
    
    def clean(self):
        """
        Validate answer data before saving and calculate time_taken_seconds.
        """
        try:
            # Auto-calculate time_taken_seconds if not already set
            if self.started_at and self.answered_at:
                time_delta = self.answered_at - self.started_at
                self.time_taken_seconds = time_delta.total_seconds()
                
                # Ensure time taken is not negative (clock skew protection)
                if self.time_taken_seconds < 0:
                    logger.warning(f"Negative time_taken_seconds detected for answer: {self.time_taken_seconds}s. Setting to 0.")
                    self.time_taken_seconds = 0.0
            
            # Validate that answered_at is not before started_at
            if self.started_at and self.answered_at and self.answered_at < self.started_at:
                raise ValueError(f"answered_at ({self.answered_at}) cannot be before started_at ({self.started_at})")
            
            # Validate retry_index is reasonable (max 10 retries to prevent abuse)
            if self.retry_index > 10:
                raise ValueError(f"retry_index ({self.retry_index}) exceeds maximum allowed retries")
            
            logger.debug(f"Answer validation passed for session {self.session_id}, question {self.question_id}")
            
        except Exception as e:
            logger.error(f"Answer validation failed for session {self.session_id}, question {self.question_id}: {str(e)}")
            raise
    
    def to_dict(self) -> dict:
        """
        Convert Answer to API-safe dictionary representation.
        
        Returns:
            dict: Answer data suitable for API responses
        """
        try:
            return {
                'id': str(self.id),
                'session_id': self.session_id,
                'question_id': self.question_id,
                'selected_option': self.selected_option,
                'is_correct': self.is_correct,
                'retry_index': self.retry_index,
                'started_at': self.started_at.isoformat() if self.started_at else None,
                'answered_at': self.answered_at.isoformat() if self.answered_at else None,
                'time_taken_seconds': round(self.time_taken_seconds, 2) if self.time_taken_seconds is not None else None,
            }
        except Exception as e:
            logger.error(f"Failed to convert Answer {self.id} to dict: {str(e)}")
            raise
    
    @classmethod
    def get_session_answers(cls, session_id: str) -> list:
        """
        Get all answers for a specific session, ordered by question and retry index.
        
        Args:
            session_id: The session ID to fetch answers for
            
        Returns:
            list: List of Answer documents for the session
        """
        try:
            answers = cls.objects(session_id=session_id).order_by('question_id', 'retry_index')
            logger.debug(f"Retrieved {len(answers)} answers for session {session_id}")
            return list(answers)
        except Exception as e:
            logger.error(f"Failed to retrieve answers for session {session_id}: {str(e)}")
            return []
    
    @classmethod
    def get_question_attempts(cls, session_id: str, question_id: str) -> list:
        """
        Get all attempts for a specific question in a session.
        
        Args:
            session_id: The session ID
            question_id: The question ID
            
        Returns:
            list: List of Answer documents for the question, ordered by retry_index
        """
        try:
            attempts = cls.objects(
                session_id=session_id,
                question_id=question_id
            ).order_by('retry_index')
            
            logger.debug(f"Retrieved {len(attempts)} attempts for session {session_id}, question {question_id}")
            return list(attempts)
        except Exception as e:
            logger.error(f"Failed to retrieve attempts for session {session_id}, question {question_id}: {str(e)}")
            return []
    
    @classmethod
    def get_final_attempt(cls, session_id: str, question_id: str) -> Optional['Answer']:
        """
        Get the final (highest retry_index) attempt for a specific question.
        
        Args:
            session_id: The session ID
            question_id: The question ID
            
        Returns:
            Answer or None: The final attempt, or None if no attempts exist
        """
        try:
            final_attempt = cls.objects(
                session_id=session_id,
                question_id=question_id
            ).order_by('-retry_index').first()
            
            if final_attempt:
                logger.debug(f"Retrieved final attempt (retry {final_attempt.retry_index}) for session {session_id}, question {question_id}")
            else:
                logger.debug(f"No attempts found for session {session_id}, question {question_id}")
                
            return final_attempt
        except Exception as e:
            logger.error(f"Failed to retrieve final attempt for session {session_id}, question {question_id}: {str(e)}")
            return None
