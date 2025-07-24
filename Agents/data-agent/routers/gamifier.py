from fastapi import APIRouter, HTTPException, Depends
from models.gamifier_models import (
    QuizSession,
    QuizQuestion,
    QuizHistory,
    FlashcardSession,
    FlashcardHistory,
    UserRewards,
    UserStreak,
    RewardResponse,
    StreakResponse
)
from db_access import gamifier_db
from utils.security import verify_agent_api_key  # Optional, if using route-level auth

router = APIRouter(
    prefix="/gamifier",
    tags=["Gamifier"],
    dependencies=[Depends(verify_agent_api_key('gamifier'))]
)

# ---------------------------
# Quiz APIs
# ---------------------------
@router.post("/enhanced-quiz/start")
def start_personalized_quiz(session: QuizSession):
    try:
        inserted_id = gamifier_db.insert_quiz_session(session)
        return {"status": "success", "session_id": str(inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/enhanced-quiz/submit")
def submit_quiz(quiz_history: QuizHistory):
    try:
        inserted_id = gamifier_db.insert_quiz_history(quiz_history)
        return {"status": "success", "history_id": str(inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/enhanced-quiz/next-question")
def get_next_question():
    # Logic handled by the agent
    return {"message": "Handled by agent logic"}

@router.post("/enhanced-quiz/complete")
def complete_quiz():
    # Logic handled by the agent
    return {"message": "Handled by agent logic"}

# ---------------------------
# Flashcard APIs
# ---------------------------
@router.get("/flashcards")
def get_daily_flashcards():
    # Logic handled by the agent
    return {"message": "Handled by agent logic"}

@router.post("/flashcards/flip")
def track_flashcard_flip(flashcard_history: FlashcardHistory):
    try:
        inserted_id = gamifier_db.insert_flashcard_history(flashcard_history)
        return {"status": "success", "history_id": str(inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/flashcards/generate")
def generate_flashcards(session: FlashcardSession):
    try:
        inserted_id = gamifier_db.insert_flashcard_session(session)
        return {"status": "success", "session_id": str(inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------
# Rewards APIs
# ---------------------------
@router.get("/rewards")
def get_user_rewards(user_id: str):
    try:
        rewards = gamifier_db.get_user_rewards(user_id)
        return rewards
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rewards/session-score")
def add_session_score(user_rewards: UserRewards):
    try:
        result = gamifier_db.update_user_rewards(user_rewards)
        return {"status": "success", "update_acknowledged": result.acknowledged}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rewards/daily-history")
def get_daily_history(user_id: str):
    try:
        history = gamifier_db.get_user_daily_history(user_id)
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------
# Streak APIs
# ---------------------------
@router.get("/streak")
def get_user_streak(user_id: str):
    try:
        streak = gamifier_db.get_user_streak(user_id)
        return streak
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
