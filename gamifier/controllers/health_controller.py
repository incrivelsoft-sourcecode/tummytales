"""
Health check controller for the Gamifier service.
Provides health status endpoint with database and external service checks.
"""

from flask import Blueprint, jsonify, g
import mongoengine
from middleware.auth import auth_optional
from services.rag_service import RAGService
from config.logger import get_logger

logger = get_logger(__name__)

# Create the health blueprint
health_bp = Blueprint('health', __name__, url_prefix='/api/gamifier')


@health_bp.route('/health', methods=['GET'])
@auth_optional
def health_check():
    """
    Health check endpoint for the Gamifier service.
    
    Auth: Optional - works with or without JWT token
    
    Returns:
        JSON response with health status and service checks
        - 200: All services are healthy
        - 503: One or more critical services are unreachable
    
    Response Format:
        {
            "status": "ok" | "error",
            "db": "ok" | "error",
            "pinecone": "ok" | "error",
            "timestamp": "ISO datetime",
            "service": "gamifier"
        }
    """
    from utils.time_utils import now_utc, to_iso
    
    logger.info("Health check requested", extra={
        "extra_fields": {
            "endpoint": "/api/gamifier/health",
            "user_authenticated": hasattr(g, 'user_id') and g.user_id is not None
        }
    })
    
    # Initialize response
    response_data = {
        "status": "ok",
        "service": "gamifier",
        "timestamp": to_iso(now_utc())
    }
    
    # Track overall health status
    overall_healthy = True
    
    # Check MongoDB connection
    try:
        # Perform quick DB ping using mongoengine
        db = mongoengine.connection.get_db()
        db.client.admin.command('ping')
        response_data["db"] = "ok"
        logger.debug("Database health check passed")
        
    except Exception as e:
        response_data["db"] = "error"
        overall_healthy = False
        logger.error("Database health check failed", extra={
            "extra_fields": {
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
    
    # Check Pinecone connection
    try:
        # Initialize RAG service and perform ping
        rag_service = RAGService()
        rag_service.init_index()  # This will initialize and check connection
        response_data["pinecone"] = "ok"
        logger.debug("Pinecone health check passed")
        
    except Exception as e:
        response_data["pinecone"] = "error"
        overall_healthy = False
        logger.error("Pinecone health check failed", extra={
            "extra_fields": {
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
    
    # Set overall status
    if not overall_healthy:
        response_data["status"] = "error"
        
        logger.warning("Health check completed with errors", extra={
            "extra_fields": {
                "db_status": response_data["db"],
                "pinecone_status": response_data["pinecone"]
            }
        })
        
        return jsonify(response_data), 503
    
    logger.info("Health check completed successfully", extra={
        "extra_fields": {
            "db_status": response_data["db"],
            "pinecone_status": response_data["pinecone"]
        }
    })
    
    return jsonify(response_data), 200