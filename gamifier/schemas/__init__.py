"""
Schemas package for Pydantic models used in the Gamifier service.
Contains request/response validation schemas for API endpoints.
"""

from .flashcard_schema import FlashcardCreateRequest, FlashcardResponse
from .quiz_schema import (
    QuizStartRequest, QuizQuestionView, QuizStartResponse,
    QuizAnswerRequest, QuizAnswerResponse, 
    SessionStatusResponse, QuizCompleteRequest, QuizCompleteResponse
)
from .stats_schema import StatsQuery, AccuracyResponse

__all__ = [
    'FlashcardCreateRequest',
    'FlashcardResponse',
    'QuizStartRequest', 
    'QuizQuestionView',
    'QuizStartResponse',
    # Task 20 & 21 schemas
    'QuizAnswerRequest',
    'QuizAnswerResponse',
    'SessionStatusResponse', 
    'QuizCompleteRequest',
    'QuizCompleteResponse',
    # Task 22 schemas
    'StatsQuery',
    'AccuracyResponse'
]
