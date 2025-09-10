"""
Rewards controller for the Gamifier service.
Provides endpoints for user badges and achievements.
"""

from flask import Blueprint, jsonify, g
from middleware.auth import auth_required
from services.rewards_service import list_badges
from schemas.rewards_schema import BadgesResponse
from config.logger import get_logger
from utils.time_utils import now_utc

logger = get_logger(__name__)

# Create the rewards blueprint
rewards_bp = Blueprint('rewards', __name__, url_prefix='/api/gamifier')


@rewards_bp.route('/badges', methods=['GET'])
@auth_required
def get_user_badges():
    """
    Get list of badges for the authenticated user.
    
    Auth: JWT required - uses g.user_id from auth middleware
    
    Returns:
        JSON response with user's badges
        - 200: Successful retrieval
        - 401: Authentication required
        - 500: Server error
    
    Response Format:
        {
            "badges": ["WEEKLY_STREAK_2024_W12", "FIRST_QUIZ", "PERFECT_SCORE"],
            "total_count": 3
        }
    """
    correlation_id = f"get_badges_{g.user_id}_{int(now_utc().timestamp())}"
    
    logger.info("Getting user badges", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": g.user_id,
            "endpoint": "/api/gamifier/badges",
            "method": "GET"
        }
    })
    
    try:
        # Get user badges from rewards service
        user_badges = list_badges(g.user_id)
        
        # Prepare response data
        response_data = {
            "badges": user_badges,
            "total_count": len(user_badges)
        }
        
        # Validate response against schema
        try:
            BadgesResponse(**response_data)
        except Exception as schema_error:
            logger.warning("Response data validation failed, but continuing", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": g.user_id,
                    "schema_error": str(schema_error)
                }
            })
        
        logger.info("Successfully retrieved user badges", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": g.user_id,
                "badges_count": response_data["total_count"],
                "badges": user_badges[:5] if len(user_badges) > 5 else user_badges  # Log first 5 for brevity
            }
        })
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error("Failed to retrieve user badges", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": g.user_id,
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        
        return jsonify({
            "error": "Failed to retrieve user badges",
            "correlation_id": correlation_id
        }), 500
