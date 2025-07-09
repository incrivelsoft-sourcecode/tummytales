from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from pydantic import BaseModel

from app.core.knowledge.rag_service import rag_service, NutritionQueryResult

router = APIRouter()

class NutritionQueryRequest(BaseModel):
    """Model for nutrition query requests"""
    query: str
    trimester: Optional[str] = "all"
    userId: Optional[str] = None

@router.post("/query", response_model=NutritionQueryResult)
async def nutrition_query(request: NutritionQueryRequest):
    """
    Get nutrition information using RAG
    
    This endpoint uses Retrieval Augmented Generation to provide
    personalized nutrition information for pregnant women.
    """
    try:
        # Initialize the RAG service if needed
        if not rag_service.initialized:
            await rag_service.initialize()
        
        # Process the query
        result = await rag_service.query(
            query=request.query,
            trimester=request.trimester
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing nutrition query: {str(e)}")

class HealthCheck(BaseModel):
    """Model for health check response"""
    status: str = "ok"
    version: str = "1.0.0"
    rag_initialized: bool = False

@router.get("/health", response_model=HealthCheck)
async def nutrition_health_check():
    """Get health status of the nutrition service"""
    return HealthCheck(
        status="ok",
        version="1.0.0",
        rag_initialized=rag_service.initialized
    )