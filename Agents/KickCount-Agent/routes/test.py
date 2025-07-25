from fastapi import APIRouter, Body
from controllers.feedback_controller import get_feedback_for_user

router = APIRouter()

@router.post("/test-feedback")
async def test_feedback(test_input: dict = Body(...)):
    """
    POST endpoint to test the full SuperKick + RAG pipeline with detailed user input.
    """
    # Pass the entire test_input to the controller
    return await get_feedback_for_user("test-user-001", custom_input=test_input)
