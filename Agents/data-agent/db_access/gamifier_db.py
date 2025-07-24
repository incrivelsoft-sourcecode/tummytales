from datetime import datetime, date, timedelta
from utils.db import db
from models.gamifier_models import (
    FlashcardHistory,
    FlashcardSession,
    ContentUsageTracking,
    QuizHistory,
    QuizSession,
    UserRewards,
    QuizCompletion,
    UserStreak,
    RewardResponse,
)

# ------------------------------
# Collections
# ------------------------------
flashcard_history_col = db["gamifier_flashcard_history"]
quiz_history_col = db["gamifier_quiz_history"]
content_usage_col = db["gamifier_content_usage"]
user_rewards_col = db["gamifier_user_rewards"]
quiz_completion_col = db["gamifier_quiz_completion"]
user_streaks_col = db["gamifier_user_streaks"]
flashcard_session_col = db["gamifier_flashcard_sessions"]
quiz_session_col = db["gamifier_quiz_sessions"]

# ------------------------------
# Flashcards
# ------------------------------
def insert_flashcard_session(session: FlashcardSession):
    doc = session.model_dump()
    doc["created_at"] = datetime.now()
    return flashcard_session_col.insert_one(doc)

def insert_flashcard_history(history: FlashcardHistory):
    doc = history.model_dump()
    return flashcard_history_col.insert_one(doc)

def get_flashcard_history(user_id: str, query_date: date):
    return flashcard_history_col.find_one({"user_id": user_id, "date": query_date})

# ------------------------------
# Quiz
# ------------------------------
def insert_quiz_session(session: QuizSession):
    doc = session.model_dump()
    doc["created_at"] = datetime.now()
    return quiz_session_col.insert_one(doc)

def insert_quiz_history(history: QuizHistory):
    doc = history.model_dump()
    return quiz_history_col.insert_one(doc)

def get_quiz_history(user_id: str, query_date: date):
    return quiz_history_col.find_one({"user_id": user_id, "date": query_date})

# ------------------------------
# Content Usage Tracking
# ------------------------------
def track_content_usage(usage: ContentUsageTracking):
    doc = usage.model_dump()
    return content_usage_col.insert_one(doc)

# ------------------------------
# Rewards
# ------------------------------
def get_user_rewards(user_id: str):
    return user_rewards_col.find_one({"user_id": user_id})

def update_user_rewards(user_id: str, update_fields: dict):
    return user_rewards_col.update_one({"user_id": user_id}, {"$set": update_fields}, upsert=True)

# ------------------------------
# Streaks
# ------------------------------
def get_user_streak(user_id: str):
    return user_streaks_col.find_one({"user_id": user_id})

def update_user_streak(user_id: str, update_fields: dict):
    return user_streaks_col.update_one({"user_id": user_id}, {"$set": update_fields}, upsert=True)

# ------------------------------
# Quiz Completion
# ------------------------------
def get_quiz_completion(user_id: str, query_date: date):
    return quiz_completion_col.find_one({"user_id": user_id, "date": query_date})

def insert_quiz_completion(data: QuizCompletion):
    doc = data.model_dump()
    return quiz_completion_col.insert_one(doc)