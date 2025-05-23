from fastapi import APIRouter
from model.askamma_model import AskAmmaQuery
from python_service.askamma_service import generate_response

router = APIRouter()

@router.post("/ask")
def ask_amma(query: AskAmmaQuery):
    return generate_response(query.dict())