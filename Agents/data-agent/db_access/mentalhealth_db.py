# db_access/mental_health_db.py
from datetime import datetime, timezone
from utils.db import db, users
from models.mentalhealth_models import QuestionModel, ScoreDocumentModel, ChatSessionModel

# -----------------------------
# Collections
# -----------------------------
mental_health_questions = db["mental_health_agent_questions"]
mental_health_scores = db["mental_health_agent_scores"]
mental_health_chats = db["mental_health_agent_chats"]

# -----------------------------
# Insert Functions
# -----------------------------
def insert_question(question: QuestionModel):
    doc = question.model_dump()
    doc["created_at"] = doc.get("created_at", datetime.now(timezone.utc))
    return mental_health_questions.insert_one(doc)

def insert_score(score_doc: ScoreDocumentModel):
    doc = score_doc.model_dump()
    doc["timestamp"] = doc.get("timestamp", datetime.now(timezone.utc))
    return mental_health_scores.insert_one(doc)

def insert_chat(chat_history: ChatSessionModel):
    doc = chat_history.model_dump()
    return mental_health_chats.insert_one(doc)

# -----------------------------
# Retrieval Functions
# -----------------------------
def get_all_questions():
    return list(mental_health_questions.find())

def get_scores_by_user(user_id: str):
    return list(mental_health_scores.find({"user_id": user_id}))

def get_chats_by_user(user_id: str):
    return list(mental_health_chats.find({"user_id": user_id}))

def get_chat_history_by_session(session_id: str):
    return mental_health_chats.find_one({"sessionId": session_id})

# -----------------------------
# Optional: Update/Delete Functions
# -----------------------------
# If needed later