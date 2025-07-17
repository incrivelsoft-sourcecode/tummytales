#nutritritionsist-lite/app/api/routes/agent.py
from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Any, Optional
import logging
from pydantic import BaseModel, Field

from app.core.crew.crew_manager import crew_manager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class AgentQueryRequest(BaseModel):
    """Model for agent query requests"""
    query: str = Field(..., description="The user's query or request")
    trimester: Optional[str] = Field("second", description="Pregnancy trimester (first, second, third)")
    dietary_restrictions: Optional[str] = Field(None, description="Comma-separated dietary restrictions")
    cuisine_preferences: Optional[str] = Field(None, description="Comma-separated cuisine preferences")
    allergies: Optional[str] = Field(None, description="Comma-separated allergens to avoid")
    nutritional_focus: Optional[str] = Field(None, description="Specific nutritional focus")
    user_id: Optional[str] = Field(None, description="User ID for personalization")

class AgentQueryResponse(BaseModel):
    """Model for agent query responses"""
    response: str = Field(..., description="The agent's response")
    status: str = Field(..., description="Status of the response")

@router.post("/query", response_model=AgentQueryResponse)
async def query_nutrition_agent(request: AgentQueryRequest):
    """
    Query the nutrition agent
    
    This endpoint sends the user's query to the nutrition agent
    and returns the agent's response.
    """
    try:
        # Initialize the crew manager if needed
        if not crew_manager.initialized:
            await crew_manager.initialize()
        
        # Create context from request
        context = {
            "trimester": request.trimester,
            "dietary_restrictions": request.dietary_restrictions,
            "cuisine_preferences": request.cuisine_preferences,
            "allergies": request.allergies,
            "nutritional_focus": request.nutritional_focus,
            "user_id": request.user_id
        }
        
        # Process the request
        result = await crew_manager.process_nutrition_request(request.query, context)
        
        return AgentQueryResponse(
            response=result,
            status="success"
        )
    except Exception as e:
        import traceback
        logger.error(f"Error processing agent query: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing agent query: {str(e)}")

@router.get("/health")
async def agent_health_check():
    """Check the health of the nutrition agent"""
    return {
        "status": "ok",
        "agent": "Dr.Nutrition",
        "initialized": crew_manager.initialized if hasattr(crew_manager, "initialized") else False
    }