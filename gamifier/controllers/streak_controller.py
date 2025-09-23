"""
Streak controller for the Gamifier service.
Provides endpoints for user streak information and management.
"""

from flask import Blueprint, jsonify, g
from middleware.auth import auth_required
from services.streak_service import get_streak
from models.user_game_profile import UserGameProfile
from schemas.streak_schema import StreakResponse
from config.logger import get_logger
from utils.time_utils import now_utc

logger = get_logger(__name__)

# Create the streak blueprint
streak_bp = Blueprint('streak', __name__, url_prefix='/api/gamifier')


@streak_bp.route('/streak', methods=['GET'])
@auth_required
def get_user_streak():
    """
    Get current streak information for the authenticated user.
    
    Auth: JWT required - uses g.user_id from auth middleware
    
    Returns:
        JSON response with streak information
        - 200: Successful retrieval
        - 401: Authentication required
        - 500: Server error
    
    Response Format:
        {
            "current_streak": int,
            "longest_streak": int, 
            "last_quiz_date": str | null  // YYYY-MM-DD format
        }
    """
    correlation_id = f"get_streak_{g.user_id}_{int(now_utc().timestamp())}"
    
    logger.info("Getting user streak information", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": g.user_id,
            "endpoint": "/api/gamifier/streak",
            "method": "GET"
        }
    })
    
    try:
        # Try to get streak from UserGameProfile directly for consistency
        profile = UserGameProfile.objects(user_id=g.user_id).first()
        
        if not profile:
            logger.info("No user profile found, returning default streak values", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": g.user_id
                }
            })
            response_data = {
                "current_streak": 0,
                "longest_streak": 0,
                "last_quiz_date": None
            }
        else:
            # Format last_quiz_date if it exists
            last_quiz_date = None
            if profile.last_quiz_date:
                last_quiz_date = profile.last_quiz_date.date().isoformat()
            
            response_data = {
                "current_streak": profile.current_streak or 0,
                "longest_streak": profile.longest_streak or 0,
                "last_quiz_date": last_quiz_date
            }
            
            logger.debug("Retrieved streak information from user profile", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": g.user_id,
                    "current_streak": response_data["current_streak"],
                    "longest_streak": response_data["longest_streak"],
                    "has_last_quiz_date": last_quiz_date is not None
                }
            })
        
        # Validate response against schema
        try:
            StreakResponse(**response_data)
        except Exception as schema_error:
            logger.warning("Response data validation failed, but continuing", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": g.user_id,
                    "schema_error": str(schema_error)
                }
            })
        
        logger.info("Successfully retrieved user streak information", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": g.user_id,
                "current_streak": response_data["current_streak"],
                "longest_streak": response_data["longest_streak"]
            }
        })
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error("Failed to retrieve user streak information", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": g.user_id,
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        
        return jsonify({
            "error": "Failed to retrieve streak information",
            "correlation_id": correlation_id
        }), 500
