from fastapi import APIRouter, Depends, HTTPException
from db_access.kickcount_db import insert_kick_movement, insert_final_kick_feedback, log_feedback_entry
from models.kickcount_models import MovementModel, FeedbackModel, FeedbackLogModel
from utils.security import verify_agent_api_key  # Optional, if using route-level auth

# router = APIRouter()
router = APIRouter(
        prefix="/kick_count",
        tags=["Kick Count"],
        dependencies=[Depends(verify_agent_api_key('kickcount'))]
    )


# -----------------------------
# INSERT
# -----------------------------

@router.post("/movement")
def add_kick_movement(data: MovementModel):
    try:
        inserted_id = insert_kick_movement(data)
        if not inserted_id:
            raise HTTPException(status_code=404, detail="User not found.")
        return {"status": "success", "inserted_id": str(inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/feedback")
def add_kick_feedback(data: FeedbackModel):
    try:
        inserted_id = insert_final_kick_feedback(data)
        if not inserted_id:
            raise HTTPException(status_code=404, detail="User not found.")
        return {"status": "success", "inserted_id": str(inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/log")
def add_feedback_log(data: FeedbackLogModel):
    try:
        inserted_id = log_feedback_entry(data)
        if not inserted_id:
            raise HTTPException(status_code=404, detail="User not found.")
        return {"status": "success", "inserted_id": str(inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
    

# -----------------------------
# FETCH
# -----------------------------
