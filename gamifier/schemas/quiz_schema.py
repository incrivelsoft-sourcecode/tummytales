"""
Quiz Pydantic schemas for API request/response validation.
Follows the existing MongoDB model structure and naming conventions.
"""

from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, validator
from config.logger import get_logger

logger = get_logger(__name__)


class QuizStartRequest(BaseModel):
    """
    Schema for starting a new quiz session.
    Validates user input for quiz session creation.
    """
    difficulty: str = Field(..., description="Quiz difficulty level")
    week: Optional[int] = Field(None, ge=1, le=52, description="Specific week number (optional)")
    
    @validator('difficulty')
    def validate_difficulty(cls, v):
        """Validate difficulty level matches available options."""
        if v not in ['easy', 'medium', 'hard']:
            raise ValueError('difficulty must be one of: easy, medium, hard')
        return v

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "difficulty": "medium",
                "week": 1
            }
        }


class QuizQuestionView(BaseModel):
    """
    Schema for individual quiz question presentation.
    Contains question data without revealing correct answers.
    """
    question_id: str = Field(..., description="Unique question identifier")
    text: str = Field(..., min_length=1, description="Question text")
    options: Dict[str, str] = Field(..., description="Answer options (option_id -> option_text)")
    
    @validator('options')
    def validate_options(cls, v):
        """Validate options dictionary has valid structure."""
        if not isinstance(v, dict) or len(v) < 2:
            raise ValueError('options must be a dictionary with at least 2 entries')
        
        # Validate all keys and values are non-empty strings
        for key, value in v.items():
            if not isinstance(key, str) or not isinstance(value, str):
                raise ValueError('option keys and values must be strings')
            if not key.strip() or not value.strip():
                raise ValueError('option keys and values cannot be empty')
        
        return v

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "question_id": "64f1a2b3c4d5e6f7g8h9i0j1",
                "text": "Which vitamin is essential for calcium absorption?",
                "options": {
                    "A": "Vitamin A",
                    "B": "Vitamin B12",
                    "C": "Vitamin C",
                    "D": "Vitamin D"
                }
            }
        }


class QuizStartResponse(BaseModel):
    """
    Schema for quiz session start response.
    Contains session information and questions for the quiz.
    """
    session_id: str = Field(..., description="Unique session identifier")
    expires_in_seconds: int = Field(..., ge=1, description="Session expiration time in seconds")
    questions: List[QuizQuestionView] = Field(..., description="List of quiz questions")
    
    @validator('questions')
    def validate_questions(cls, v):
        """Validate questions list has appropriate content."""
        if not isinstance(v, list) or len(v) == 0:
            raise ValueError('questions must be a non-empty list')
        
        # Validate each question has unique question_id
        question_ids = [q.question_id for q in v]
        if len(question_ids) != len(set(question_ids)):
            raise ValueError('all questions must have unique question_ids')
        
        return v

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "session_id": "64f1a2b3c4d5e6f7g8h9i0j1",
                "expires_in_seconds": 300,
                "questions": [
                    {
                        "question_id": "64f1a2b3c4d5e6f7g8h9i0j1",
                        "text": "Which vitamin is essential for calcium absorption?",
                        "options": {
                            "A": "Vitamin A",
                            "B": "Vitamin B12",
                            "C": "Vitamin C",
                            "D": "Vitamin D"
                        }
                    },
                    {
                        "question_id": "64f1a2b3c4d5e6f7g8h9i0j2",
                        "text": "What is the recommended daily water intake?",
                        "options": {
                            "A": "4 glasses",
                            "B": "6 glasses", 
                            "C": "8 glasses",
                            "D": "10 glasses"
                        }
                    }
                ]
            }
        }


# Task 20: Quiz Answer Request & Response schemas
class QuizAnswerRequest(BaseModel):
    """
    Schema for submitting a quiz answer.
    Tracks timing and user response data for scoring and analytics.
    """
    session_id: str = Field(..., description="Unique quiz session identifier")
    question_id: str = Field(..., description="Question being answered")
    selected_option: str = Field(..., description="User's selected answer option")
    started_at: datetime = Field(..., description="When user started viewing this question")
    answered_at: datetime = Field(..., description="When user submitted their answer")
    
    @validator('selected_option')
    def validate_selected_option(cls, v):
        """Validate selected option is a valid choice."""
        if not isinstance(v, str) or not v.strip():
            raise ValueError('selected_option must be a non-empty string')
        return v.strip()
    
    @validator('answered_at')
    def validate_answer_timing(cls, v, values):
        """Validate answer time is after start time."""
        if 'started_at' in values and v < values['started_at']:
            raise ValueError('answered_at must be after started_at')
        return v

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "session_id": "64f1a2b3c4d5e6f7g8h9i0j1",
                "question_id": "64f1a2b3c4d5e6f7g8h9i0j2", 
                "selected_option": "D",
                "started_at": "2025-09-05T10:30:00Z",
                "answered_at": "2025-09-05T10:30:15Z"
            }
        }


class QuizAnswerResponse(BaseModel):
    """
    Schema for quiz answer submission response.
    Provides feedback and next action guidance to the user.
    """
    is_correct: bool = Field(..., description="Whether the answer was correct")
    retry_allowed: bool = Field(..., description="Whether user can retry this question")
    preview_points: int = Field(..., ge=0, description="Points that would be awarded")
    next_action: str = Field(..., description="Next action user should take")
    
    @validator('next_action')
    def validate_next_action(cls, v):
        """Validate next action is one of the expected values."""
        valid_actions = ['continue', 'retry', 'complete', 'timeout']
        if v not in valid_actions:
            raise ValueError(f'next_action must be one of: {", ".join(valid_actions)}')
        return v

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "is_correct": True,
                "retry_allowed": False,
                "preview_points": 5,
                "next_action": "continue"
            }
        }


# Task 21: Session Status & Completion schemas  
class SessionStatusResponse(BaseModel):
    """
    Schema for quiz session status information.
    Provides current session state and progress details.
    """
    session_id: str = Field(..., description="Unique session identifier")
    status: str = Field(..., description="Current session status")
    remaining_seconds: int = Field(..., ge=0, description="Seconds remaining before timeout")
    questions_status: List[Dict] = Field(..., description="Status of each question in session")
    
    @validator('status')
    def validate_status(cls, v):
        """Validate status matches expected session states."""
        valid_statuses = ['started', 'in_progress', 'retry', 'completed', 'timed_out', 'abandoned']
        if v not in valid_statuses:
            raise ValueError(f'status must be one of: {", ".join(valid_statuses)}')
        return v
    
    @validator('questions_status')
    def validate_questions_status(cls, v):
        """Validate questions status list structure."""
        if not isinstance(v, list):
            raise ValueError('questions_status must be a list')
        
        for idx, question_status in enumerate(v):
            if not isinstance(question_status, dict):
                raise ValueError(f'questions_status[{idx}] must be a dictionary')
            
            required_keys = ['question_id', 'status']
            for key in required_keys:
                if key not in question_status:
                    raise ValueError(f'questions_status[{idx}] missing required key: {key}')
        
        return v

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "session_id": "64f1a2b3c4d5e6f7g8h9i0j1",
                "status": "in_progress",
                "remaining_seconds": 240,
                "questions_status": [
                    {
                        "question_id": "64f1a2b3c4d5e6f7g8h9i0j2",
                        "status": "answered",
                        "is_correct": True,
                        "attempts": 1
                    },
                    {
                        "question_id": "64f1a2b3c4d5e6f7g8h9i0j3", 
                        "status": "current",
                        "attempts": 0
                    },
                    {
                        "question_id": "64f1a2b3c4d5e6f7g8h9i0j4",
                        "status": "pending", 
                        "attempts": 0
                    }
                ]
            }
        }


class QuizCompleteRequest(BaseModel):
    """
    Schema for completing a quiz session.
    Simple request to finalize session and calculate results.
    """
    session_id: str = Field(..., description="Session to complete")

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "session_id": "64f1a2b3c4d5e6f7g8h9i0j1"
            }
        }


class QuizCompleteResponse(BaseModel):
    """
    Schema for quiz completion response.
    Contains final results, points, and any badges earned.
    """
    score: int = Field(..., ge=0, description="Final quiz score (correct answers)")
    awarded_points: int = Field(..., ge=0, description="Points awarded for this quiz")
    badges_awarded: List[str] = Field(..., description="Any new badges earned")
    
    @validator('badges_awarded')
    def validate_badges_awarded(cls, v):
        """Validate badges list contains valid badge types."""
        if not isinstance(v, list):
            raise ValueError('badges_awarded must be a list')
        
        # Import badge types for validation
        from utils.constants import BADGE_TYPES
        for badge in v:
            if not isinstance(badge, str):
                raise ValueError('all badges must be strings')
            if badge not in BADGE_TYPES:
                raise ValueError(f'invalid badge type: {badge}')
        
        return v

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "score": 2,
                "awarded_points": 12,
                "badges_awarded": ["perfect_score", "streak_warrior"]
            }
        }
