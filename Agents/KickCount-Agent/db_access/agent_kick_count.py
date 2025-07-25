# agent_kick_count.py
from datetime import datetime, timezone
from db_access.db_access import db, users
from models.movement import MovementModel, FeedbackModel, FeedbackLogModel

# Collections
kick_movements = db["kick_agent_movements"]
kick_feedback = db["kick_agent_feedback"]
kick_feedback_logs = db["kick_agent_feedback_logs"]

# Movement entry insert
def insert_kick_movement(movement: MovementModel):
    if not users.find_one({"user_id": movement.user_id}):
        print(f"[kick_agent] User {movement.user_id} not found.")
        return None
    return kick_movements.insert_one(movement.model_dump()).inserted_id

# Final feedback insert
def insert_final_kick_feedback(feedback: FeedbackModel):
    if not users.find_one({"user_id": feedback.user_id}):
        print(f"[kick_agent] User {feedback.user_id} not found.")
        return None
    return kick_feedback.insert_one(feedback.model_dump()).inserted_id

# Feedback history log
def log_feedback_entry(entry: FeedbackLogModel):
    if not users.find_one({"user_id": entry.user_id}):
        print(f"[kick_agent] User {entry.user_id} not found.")
        return None
    return kick_feedback_logs.insert_one(entry.model_dump()).inserted_id




# -----------------------------
# Updated Index or Validation Setup
# -----------------------------

def create_kick_agent_indexes():
    kick_movements.create_index("user_id")
    kick_movements.create_index("session_id")
    kick_movements.create_index("timestamp")
    kick_feedback.create_index("user_id")
    kick_feedback_logs.create_index("user_id")
    kick_feedback_logs.create_index("session_id")
    kick_feedback_logs.create_index("timestamp")
    print("[kick_agent] Indexes created.")