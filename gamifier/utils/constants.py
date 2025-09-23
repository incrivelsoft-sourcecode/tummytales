"""
Constants and configuration values for the Gamifier service.
"""

import os

# Quiz and Flashcard Limits
MAX_QUIZZES_PER_DAY = int(os.getenv("MAX_QUIZZES_PER_DAY", "2"))
QUESTIONS_PER_SESSION = 3
RETRY_LIMITS = 1
FLASHCARD_FLIPS_PER_DAY = 3
FLASHCARD_FLIPS_MAX_POINTS_PER_DAY = 15

# Similarity and Search Settings
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.6"))
RAG_TOPK_QUIZ = 10
RAG_TOPK_FLASHCARD = 5

# Time Limits
QUIZ_SESSION_MAX_MINUTES = int(os.getenv("QUIZ_SESSION_MAX_MINUTES", "5"))

# Session Configuration
FLASHCARDS_PER_SESSION = 3

# Point System
POINTS_PER_CORRECT_ANSWER = 10
POINTS_PER_FLASHCARD_FLIP = 5
POINTS_STREAK_BONUS = 2

# Daily Point Limits
MAX_DAILY_POINTS = 75  # 15 from flashcards + 60 from quizzes
QUIZ_MAX_POINTS_PER_DAY = MAX_QUIZZES_PER_DAY * QUESTIONS_PER_SESSION * POINTS_PER_CORRECT_ANSWER  # 2 * 3 * 10 = 60

# Badge System
BADGE_TYPES = [
    "quiz_master",      # Complete 10 quizzes
    "streak_warrior",   # Maintain 7-day streak
    "flashcard_hero",   # Complete 50 flashcards
    "perfect_score",    # Get 100% on a quiz
    "early_bird",       # Complete quiz before 9 AM
    "night_owl",        # Complete quiz after 9 PM
    "consistent",       # Complete quizzes 5 days in a row
    "explorer",         # Try all difficulty levels
]

# Difficulty Levels
DIFFICULTY_LEVELS = ["easy", "medium", "hard"]

# Session Status
SESSION_STATUS = {
    "STARTED": "started",
    "IN_PROGRESS": "in_progress", 
    "RETRY": "retry",
    "COMPLETED": "completed",
    "TIMED_OUT": "timed_out",
    "ABANDONED": "abandoned",
    # Legacy status for backwards compatibility
    "ACTIVE": "active",
    "EXPIRED": "expired"
}

# API Response Messages
MESSAGES = {
    "QUIZ_LIMIT_REACHED": "Daily quiz limit reached. Please try again tomorrow.",
    "FLASHCARD_LIMIT_REACHED": "Daily flashcard limit reached. Please try again tomorrow.",
    "SESSION_EXPIRED": "Quiz session has expired.",
    "INVALID_ANSWER": "Invalid answer provided.",
    "USER_NOT_FOUND": "User profile not found.",
    "INSUFFICIENT_DATA": "Not enough data available for content generation.",
    "AI_GENERATION_FAILED": "Failed to generate content. Please try again.",
    "SUCCESS": "Operation completed successfully."
}
