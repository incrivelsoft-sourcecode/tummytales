from fastapi import APIRouter, HTTPException
from controllers.llm_feedback_controller import get_feedback_for_user

router = APIRouter()

@router.post("/feedback")
async def get_simple_feedback():
    try:
        # Pass a dummy user or None if not required
        return await get_feedback_for_user(user=None)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))