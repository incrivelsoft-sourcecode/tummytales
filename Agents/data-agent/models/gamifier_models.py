from typing import Optional, Dict, List
from pydantic import BaseModel, Field, EmailStr
import uuid
from datetime import datetime

# gamifier_models.py

from typing import Optional, List, Dict
from pydantic import BaseModel, Field
from datetime import datetime, date


# ----------------------------
# 1. Content Usage Tracking
# ----------------------------
class ContentUsageTracking(BaseModel):
    user_id: str
    pregnancy_week: str
    content_type: str  # "quiz" or "flashcard"
    content_hash: str
    content_embedding: Optional[List[float]] = None
    usage_dates: List[date] = Field(default_factory=list)
    usage_count_this_week: int = 0
    week_start_date: date
    created_at: datetime = Field(default_factory=datetime.now)
    expires_at: datetime


# ----------------------------
# 2. Flashcard Models
# ----------------------------
class FlashcardItem(BaseModel):
    front: str
    back: str
    was_flipped: bool = False
    flip_timestamp: Optional[datetime] = None
    flashcard_embedding: Optional[List[float]] = None
    flashcard_hash: str
    points_earned: int = 0


class FlashcardSessionMetadata(BaseModel):
    total_flashcards: int
    flipped_count: int
    total_points_earned: int


class FlashcardHistory(BaseModel):
    user_id: str
    date: date
    session_id: str
    pregnancy_week: str
    flashcards: List[FlashcardItem]
    session_metadata: FlashcardSessionMetadata
    created_at: datetime = Field(default_factory=datetime.now)
    expires_at: datetime


class Flashcard(BaseModel):
    front: str
    back: str


class FlashcardSession(BaseModel):
    user_id: str
    week: str
    date: date
    flashcards: List[Flashcard]
    prompt_version: str
    raw_prompt: str
    raw_response: str


# ----------------------------
# 3. Quiz Models
# ----------------------------
class QuizQuestion(BaseModel):
    question_text: str
    options: List[str]
    correct_answer: str
    user_answer: str
    is_correct: bool
    attempt_number: int = 1
    is_retry: bool = False
    question_embedding: Optional[List[float]] = None
    question_hash: str
    timestamp: datetime

## Confirm the quiz-question model

# class QuizQuestion(BaseModel):
#     question_id: str
#     text: str
#     options: List[str]
#     answer: str
#     explanation: str
#     is_spaced_repetition: bool = False
#     user_answer: Optional[str] = None
#     correct: Optional[bool] = None


class QuizSessionMetadata(BaseModel):
    total_questions: int
    correct_answers: int
    session_completed: bool
    points_earned: int
    phase: str = "initial"  # "initial" or "retry"


class QuizHistory(BaseModel):
    user_id: str
    date: date
    session_id: str
    pregnancy_week: str
    questions: List[QuizQuestion]
    session_metadata: QuizSessionMetadata
    created_at: datetime = Field(default_factory=datetime.now)
    expires_at: datetime


class QuizSession(BaseModel):
    user_id: str
    week: str
    questions: List[QuizQuestion]
    timestamp: datetime
    prompt_version: str
    raw_prompt: str
    raw_response: str


# ----------------------------
# 4. Rewards and Streaks
# ----------------------------
class DailyHistory(BaseModel):
    date: date
    points_earned: int
    activity_type: str  # 'quiz', 'flashcard', 'daily_login'


class Rewards(BaseModel):
    total_points: int = 0
    daily_history: List[DailyHistory] = Field(default_factory=list)


class UserRewards(BaseModel):
    user_id: str
    total_points: int = 0
    points_today: int = 0
    last_updated: date
    daily_history: List[Dict] = []
    created_at: datetime
    updated_at: datetime


class RewardResponse(BaseModel):
    user_id: str
    total_points: int
    points_earned_today: int
    correct_answers_today: int
    points_per_correct: int = 10


class QuizCompletion(BaseModel):
    user_id: str
    date: date
    completed: bool = False
    score: int = 0
    total_questions: int = 5
    points_earned: int = 0


class UserStreak(BaseModel):
    user_id: str
    current_streak: int = 0
    longest_streak: int = 0
    last_completion_date: Optional[date] = None
    total_days_completed: int = 0
    created_at: datetime
    updated_at: datetime


class StreakResponse(BaseModel):
    user_id: str
    current_streak: int
    longest_streak: int
    total_days_completed: int
    completed_today: bool
    streak_maintained: bool