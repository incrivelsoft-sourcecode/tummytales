from fastapi import APIRouter
from model.askamma_model import AskAmmaQuery
from agent.askamma_agent import DrAmmaAgent

router = APIRouter()

@router.post("/ask")
def ask_amma(query: AskAmmaQuery):
    try:
        response = DrAmmaAgent().generate_response(query.dict())
        return {"response": response}
    except Exception as e:
        return {"error": str(e)}