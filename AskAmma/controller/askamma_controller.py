from fastapi import APIRouter
from model.askamma_model import AskAmmaQuery
from python_service.askamma_service import generate_response

router = APIRouter()

@router.post("/ask")
def ask_amma(query: AskAmmaQuery):
    try:
        return {"response": generate_response(query.dict())}
    except Exception as e:
        return {"error": str(e)}
