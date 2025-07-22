from fastapi import APIRouter, Depends, HTTPException, status
from db_access import mentalhealth_db
from models.mentalhealth_models import QuestionModel, ScoreDocumentModel, ChatSessionModel
from utils.security import verify_agent_api_key  # Optional, if using route-level auth

# router = APIRouter()
router = APIRouter(
        prefix="/mental_health",
        tags=["Mental Health"], 
        dependencies=[Depends(verify_agent_api_key("mental_health"))]
    )

# -----------------------------
# INSERT
# -----------------------------

@router.post("/question")
def insert_question(question: QuestionModel):
    try:
        inserted_id = mentalhealth_db.insert_question(question)
        return {"status": "success", "inserted_id": str(inserted_id.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/score")
def insert_score(score: ScoreDocumentModel):
    try:
        inserted_id = mentalhealth_db.insert_score(score)
        return {"status": "success", "inserted_id": str(inserted_id.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/chat")
def insert_chat(chat: ChatSessionModel):
    try:
        inserted_id = mentalhealth_db.insert_chat(chat)
        return {"status": "success", "inserted_id": str(inserted_id.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# -----------------------------
# FETCH
# -----------------------------

@router.get("/questions")
def get_all_questions():
    try:
        return {"status": "success", "data": mentalhealth_db.get_all_questions()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/scores/{user_id}")
def get_scores_by_user(user_id: str):
    try:
        return {"status": "success", "data": mentalhealth_db.get_scores_by_user(user_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/chats/{user_id}")
def get_chats_by_user(user_id: str):
    try:
        return {"status": "success", "data": mentalhealth_db.get_chats_by_user(user_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/chat/session/{session_id}")
def get_chat_by_session(session_id: str):
    try:
        chat = mentalhealth_db.get_chat_history_by_session(session_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"status": "success", "data": chat}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")