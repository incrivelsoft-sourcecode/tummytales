# controller/askamma_controller.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from model.askamma_model import AskAmmaQuery
from agent.askamma_agent import DrAmmaAgent
from context.mcp_context import MCPContext
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize agent instance (optional: can be singleton)
agent_instance = None

def get_agent():
    """Get or create agent instance"""
    global agent_instance
    if agent_instance is None:
        agent_instance = DrAmmaAgent()
    return agent_instance

@router.post("/ask")
async def ask_amma(query: AskAmmaQuery):
    """
    Ask Dr. Amma a pregnancy-related question
    """
    start_time = datetime.now()
    
    try:
        # Convert query to dict
        query_dict = query.dict()
        
        # Log the request (without sensitive data)
        logger.info(f"New question received - Category: {MCPContext(query_dict).category}")
        
        # Get agent and generate response
        agent = get_agent()
        response = agent.generate_response(query_dict)
        
        # Calculate response time
        response_time = (datetime.now() - start_time).total_seconds()
        
        # Log success
        logger.info(f"Response generated successfully in {response_time:.2f}s")
        
        return JSONResponse(
            status_code=200,
            content={
                "response": response,
                "metadata": {
                    "response_time": response_time,
                    "timestamp": datetime.now().isoformat(),
                    "status": "success"
                }
            }
        )
        
    except Exception as e:
        # Calculate response time even for errors
        response_time = (datetime.now() - start_time).total_seconds()
        
        # Log error
        logger.error(f"Error generating response: {str(e)}")
        
        return JSONResponse(
            status_code=500,
            content={
                "error": "Failed to generate response",
                "message": str(e),
                "metadata": {
                    "response_time": response_time,
                    "timestamp": datetime.now().isoformat(),
                    "status": "error"
                }
            }
        )

@router.post("/context-info")
async def get_context_info(query: AskAmmaQuery):
    """
    Get context information for debugging purposes
    """
    try:
        query_dict = query.dict()
        agent = get_agent()
        context_info = agent.get_context_info(query_dict)
        
        return JSONResponse(
            status_code=200,
            content={
                "context": context_info,
                "timestamp": datetime.now().isoformat()
            }
        )
        
    except Exception as e:
        logger.error(f"Error getting context info: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "error": "Failed to get context information",
                "message": str(e)
            }
        )

@router.post("/test-connection")
async def test_connection():
    """
    Test the connection to the LLM service
    """
    try:
        agent = get_agent()
        connection_status = agent.test_connection()
        
        return JSONResponse(
            status_code=200,
            content={
                "connection_status": connection_status,
                "message": "Connection test completed",
                "timestamp": datetime.now().isoformat()
            }
        )
        
    except Exception as e:
        logger.error(f"Connection test failed: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "connection_status": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )

@router.post("/clear-memory")
async def clear_memory():
    """
    Clear the conversation memory
    """
    try:
        agent = get_agent()
        memory_cleared = agent.clear_memory()
        
        return JSONResponse(
            status_code=200,
            content={
                "memory_cleared": memory_cleared,
                "message": "Memory cleared successfully" if memory_cleared else "Failed to clear memory",
                "timestamp": datetime.now().isoformat()
            }
        )
        
    except Exception as e:
        logger.error(f"Error clearing memory: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "memory_cleared": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )