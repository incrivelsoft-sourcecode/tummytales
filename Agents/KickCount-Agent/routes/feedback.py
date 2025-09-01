from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from controllers.llm_feedback_controller import get_feedback_for_user, get_daily_summary
from typing import Optional

router = APIRouter()


class FeedbackRequest(BaseModel):
    user_id: Optional[str] = None
    

@router.post("/feedback", response_model=None)   # disable auto‑schema for now
async def feedback(
    body: FeedbackRequest,
    user_id: Optional[str] = Query(None)        # fallback to query
):
    uid = body.user_id or user_id               # whichever is present
    if not uid:
        raise HTTPException(status_code=422, detail="user_id required")

    # controller already raises 404 if profile is missing
    return await get_feedback_for_user(user_id=uid)
    
# ─────────────────────────────────────────────────────────────
# POST /api/daily-feedback – Get daily feedback for a user
# ─────────────────────────────────────────────────────────────
@router.get("/daily-feedback")
async def get_daily_summary_user(user_id: str):
    try:
        return await get_daily_summary(user_id=user_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))