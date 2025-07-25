# agent_kick_count.py

from datetime import datetime, timezone
from utils.db import db, users
from models.kickcount_models import MovementModel, FeedbackModel, FeedbackLogModel

"""
User Context needed for this agent

### Pregnancy Details:
- Currently Pregnant: {preg.get('currentlyPregnant')}
- LMP: {preg.get('Last_menstrualperiod')}
- EDD: {preg.get('estimatedDueDate')}
 
### Previous Pregnancy Loss:
- Had Loss: {preg.get('PregnancyLossInfo', {}).get('hasPregnancyLoss')}
- Date of Loss: {loss.get('dateOfLoss')}
- Reason: {loss.get('reason')}
- Gestation Weeks: {loss.get('gestationWeeks')}
- Treatment Location: {loss.get('treatmentLocation')}
 
### Last Child Info:
- Is First Child: {preg.get('firstChildInfo', {}).get('isFirstChild')}
- DOB: {child.get('dob')}
- Complications: {child.get('complications')}
- Delivery Method: {child.get('deliverymethod')}
- Birth Location: {child.get('childbornlocation')}
- Gestational Age at Birth: {child.get('gestationalAgeAtBirth')}
 
### Health Info:
- Height: {health.get('height')}
- Weight: {health.get('weight')}
 
### Experience & Expectations:
- Expectations: {exp.get('expectations')}
- Challenges: {exp.get('challenges')}

"""

# Collections
kick_movements = db["kickcount_agent_movements"]
kick_feedback = db["kickcount_agent_feedback"]
kick_feedback_logs = db["kickcount_agent_feedback_logs"]

# Movement entry insert
def insert_kick_movement(movement: MovementModel):
    """
    Insert a kick movement record into the database.

    Args:
        movement (MovementModel): The movement data model containing user_id and movement details.

    Returns:
        Inserted document ID if successful, None if user not found or on error.
    """
    try:
        if not users.find_one({"user_id": movement.user_id}):
            print(f"[kick_agent] User {movement.user_id} not found.")
            return None
        return kick_movements.insert_one(movement.model_dump()).inserted_id
    except Exception as e:
        print(f"[kick_agent] Error inserting kick movement for user {movement.user_id}: {e}")
        return None

# Final feedback insert
def insert_final_kick_feedback(feedback: FeedbackModel):
    """
    Insert final kick feedback into the database.

    Args:
        feedback (FeedbackModel): The feedback data model containing user_id and feedback details.

    Returns:
        Inserted document ID if successful, None if user not found or on error.
    """
    try:
        if not users.find_one({"user_id": feedback.user_id}):
            print(f"[kick_agent] User {feedback.user_id} not found.")
            return None
        return kick_feedback.insert_one(feedback.model_dump()).inserted_id
    except Exception as e:
        print(f"[kick_agent] Error inserting final kick feedback for user {feedback.user_id}: {e}")
        return None

# Feedback history log
def log_feedback_entry(entry: FeedbackLogModel):
    """
    Log a feedback entry into the feedback logs collection.

    Args:
        entry (FeedbackLogModel): The feedback log data model containing user_id and log details.

    Returns:
        Inserted document ID if successful, None if user not found or on error.
    """
    try:
        if not users.find_one({"user_id": entry.user_id}):
            print(f"[kick_agent] User {entry.user_id} not found.")
            return None
        return kick_feedback_logs.insert_one(entry.model_dump()).inserted_id
    except Exception as e:
        print(f"[kick_agent] Error logging feedback entry for user {entry.user_id}: {e}")
        return None




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