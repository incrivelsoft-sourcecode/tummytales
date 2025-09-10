"""
Stats controller for the Gamifier service.
Provides endpoints for user statistics and analytics.
"""

from datetime import date, datetime, timedelta
from typing import Dict, Any, Tuple, Optional

try:
    from flask import Blueprint, jsonify, g, request, abort
except ImportError:
    # Handle case where Flask might not be available during linting
    pass

from middleware.auth import auth_required, admin_required
from services.stats_service import (
    get_stats_summary, get_day_stats, get_questions_stats, compute_accuracy
)
from schemas.stats_schema import (
    StatsSummaryResponse, DayStatsResponse, QuestionsStatsResponse, 
    AccuracyResponse, StatsQuery
)
from config.logger import get_logger
from utils.time_utils import now_utc

logger = get_logger(__name__)

# Create the stats blueprint
stats_bp = Blueprint('stats', __name__, url_prefix='/api/gamifier')


def _parse_date_range(range_param: str, from_date: Optional[str] = None, to_date: Optional[str] = None) -> Tuple[date, date]:
    """
    Parse date range parameter into actual dates.
    
    Args:
        range_param: Range parameter (today, last_7_days, etc.)
        from_date: Custom from date (YYYY-MM-DD format)
        to_date: Custom to date (YYYY-MM-DD format)
        
    Returns:
        tuple: (from_date, to_date) as date objects
        
    Raises:
        ValueError: If invalid date range or format
    """
    today = now_utc().date()
    
    if range_param == 'custom':
        if not from_date or not to_date:
            raise ValueError("from_date and to_date are required for custom range")
        
        try:
            from_dt = datetime.strptime(from_date, '%Y-%m-%d').date()
            to_dt = datetime.strptime(to_date, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError("Invalid date format. Use YYYY-MM-DD")
        
        if from_dt > to_dt:
            raise ValueError("from_date cannot be after to_date")
        
        return from_dt, to_dt
    
    # Predefined ranges
    range_map = {
        'today': (today, today),
        'yesterday': (today - timedelta(days=1), today - timedelta(days=1)),
        'last_7_days': (today - timedelta(days=6), today),
        'last_30_days': (today - timedelta(days=29), today),
        'last_90_days': (today - timedelta(days=89), today),
        'this_week': (today - timedelta(days=today.weekday()), today),
        'last_week': (
            today - timedelta(days=today.weekday() + 7), 
            today - timedelta(days=today.weekday() + 1)
        ),
        'this_month': (today.replace(day=1), today),
        'last_month': (
            (today.replace(day=1) - timedelta(days=1)).replace(day=1),
            today.replace(day=1) - timedelta(days=1)
        )
    }
    
    if range_param not in range_map:
        raise ValueError(f"Invalid range: {range_param}")
    
    return range_map[range_param]


def _check_admin_or_own_data(user_id_param: Optional[str] = None) -> str:
    """
    Check if user can access the requested data.
    Admin can access any user's data, regular users can only access their own.
    
    Args:
        user_id_param: Optional user_id from request parameters
        
    Returns:
        str: The user_id to use for the query
        
    Raises:
        403: If non-admin user tries to access other user's data
    """
    # If no user_id specified, use authenticated user's data
    if not user_id_param:
        return g.user_id
    
    # If admin, allow access to any user's data
    if hasattr(g, 'user_role') and g.user_role == 'admin':
        return user_id_param
    
    # If user_id_param matches authenticated user, allow
    if user_id_param == g.user_id:
        return user_id_param
    
    # Otherwise, deny access
    logger.warning("User attempted to access other user's stats", extra={
        "extra_fields": {
            "authenticated_user": g.user_id,
            "requested_user": user_id_param,
            "user_role": getattr(g, 'user_role', None)
        }
    })
    
    abort(403)


@stats_bp.route('/stats/summary', methods=['GET'])
@auth_required
def get_stats_summary_endpoint():
    """
    Get comprehensive statistics summary for user in date range.
    
    Auth: JWT required - Admin for broad queries; user-limited queries for own data
    
    Query Parameters:
        - range: Predefined range (today, last_7_days, etc.) or 'custom'
        - from_date: Custom start date (YYYY-MM-DD) - required if range=custom
        - to_date: Custom end date (YYYY-MM-DD) - required if range=custom
        - user_id: Target user ID (admin only, defaults to authenticated user)
    
    Returns:
        JSON response with comprehensive stats summary
        - 200: Successful retrieval
        - 400: Invalid parameters
        - 401: Authentication required
        - 403: Access denied (non-admin accessing other user's data)
        - 500: Server error
    """
    correlation_id = f"stats_summary_{g.user_id}_{int(now_utc().timestamp())}"
    
    logger.info("Getting stats summary", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "authenticated_user": g.user_id,
            "endpoint": "/api/gamifier/stats/summary",
            "method": "GET"
        }
    })
    
    try:
        # Parse query parameters
        range_param = request.args.get('range', 'last_7_days')
        from_date_param = request.args.get('from_date')
        to_date_param = request.args.get('to_date')
        user_id_param = request.args.get('user_id')
        
        # Validate and get target user
        target_user_id = _check_admin_or_own_data(user_id_param)
        
        # Parse date range
        from_date, to_date = _parse_date_range(range_param, from_date_param, to_date_param)
        
        # Get stats summary
        stats_data = get_stats_summary(target_user_id, from_date, to_date)
        
        logger.info("Successfully retrieved stats summary", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "target_user": target_user_id,
                "date_range": f"{from_date} to {to_date}",
                "quiz_count": stats_data.get("quiz_count", 0)
            }
        })
        
        return jsonify(stats_data), 200
        
    except ValueError as e:
        logger.warning("Invalid parameters for stats summary", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "error": str(e)
            }
        })
        return jsonify({"error": str(e), "correlation_id": correlation_id}), 400
        
    except Exception as e:
        logger.error("Failed to retrieve stats summary", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "authenticated_user": g.user_id,
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        
        return jsonify({
            "error": "Failed to retrieve stats summary",
            "correlation_id": correlation_id
        }), 500


@stats_bp.route('/stats/day/<date_str>', methods=['GET'])
@auth_required
def get_day_stats_endpoint(date_str: str):
    """
    Get statistics for a specific day.
    
    Auth: JWT required - Admin for broad queries; user-limited queries for own data
    
    Path Parameters:
        - date_str: Date in YYYY-MM-DD format
    
    Query Parameters:
        - user_id: Target user ID (admin only, defaults to authenticated user)
    
    Returns:
        JSON response with day-specific stats
        - 200: Successful retrieval
        - 400: Invalid date format
        - 401: Authentication required
        - 403: Access denied (non-admin accessing other user's data)
        - 500: Server error
    """
    correlation_id = f"day_stats_{g.user_id}_{date_str}_{int(now_utc().timestamp())}"
    
    logger.info("Getting day stats", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "authenticated_user": g.user_id,
            "date_str": date_str,
            "endpoint": f"/api/gamifier/stats/day/{date_str}",
            "method": "GET"
        }
    })
    
    try:
        # Parse date parameter
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError("Invalid date format. Use YYYY-MM-DD")
        
        # Parse query parameters
        user_id_param = request.args.get('user_id')
        
        # Validate and get target user
        target_user_id = _check_admin_or_own_data(user_id_param)
        
        # Get day stats
        day_data = get_day_stats(target_user_id, target_date)
        
        logger.info("Successfully retrieved day stats", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "target_user": target_user_id,
                "target_date": date_str,
                "quiz_count": day_data.get("quiz_count", 0)
            }
        })
        
        return jsonify(day_data), 200
        
    except ValueError as e:
        logger.warning("Invalid parameters for day stats", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "date_str": date_str,
                "error": str(e)
            }
        })
        return jsonify({"error": str(e), "correlation_id": correlation_id}), 400
        
    except Exception as e:
        logger.error("Failed to retrieve day stats", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "authenticated_user": g.user_id,
                "date_str": date_str,
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        
        return jsonify({
            "error": "Failed to retrieve day stats",
            "correlation_id": correlation_id
        }), 500


@stats_bp.route('/stats/questions', methods=['GET'])
@auth_required
def get_questions_stats_endpoint():
    """
    Get detailed question-level statistics.
    
    Auth: JWT required - Admin for broad queries; user-limited queries for own data
    
    Query Parameters:
        - range: Predefined range (today, last_7_days, etc.) or 'custom'
        - from_date: Custom start date (YYYY-MM-DD) - required if range=custom
        - to_date: Custom end date (YYYY-MM-DD) - required if range=custom
        - groupBy: Optional grouping ('difficulty', 'section')
        - user_id: Target user ID (admin only, defaults to authenticated user)
    
    Returns:
        JSON response with question-level stats
        - 200: Successful retrieval
        - 400: Invalid parameters
        - 401: Authentication required
        - 403: Access denied (non-admin accessing other user's data)
        - 500: Server error
    """
    correlation_id = f"questions_stats_{g.user_id}_{int(now_utc().timestamp())}"
    
    logger.info("Getting questions stats", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "authenticated_user": g.user_id,
            "endpoint": "/api/gamifier/stats/questions",
            "method": "GET"
        }
    })
    
    try:
        # Parse query parameters
        range_param = request.args.get('range', 'last_7_days')
        from_date_param = request.args.get('from_date')
        to_date_param = request.args.get('to_date')
        group_by_param = request.args.get('groupBy')
        user_id_param = request.args.get('user_id')
        
        # Validate groupBy parameter
        if group_by_param and group_by_param not in ['difficulty', 'section']:
            raise ValueError("groupBy must be 'difficulty' or 'section'")
        
        # Validate and get target user
        target_user_id = _check_admin_or_own_data(user_id_param)
        
        # Parse date range
        from_date, to_date = _parse_date_range(range_param, from_date_param, to_date_param)
        
        # Get questions stats
        questions_data = get_questions_stats(target_user_id, from_date, to_date, group_by_param)
        
        logger.info("Successfully retrieved questions stats", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "target_user": target_user_id,
                "date_range": f"{from_date} to {to_date}",
                "group_by": group_by_param,
                "total_questions": questions_data.get("total_questions", 0)
            }
        })
        
        return jsonify(questions_data), 200
        
    except ValueError as e:
        logger.warning("Invalid parameters for questions stats", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "error": str(e)
            }
        })
        return jsonify({"error": str(e), "correlation_id": correlation_id}), 400
        
    except Exception as e:
        logger.error("Failed to retrieve questions stats", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "authenticated_user": g.user_id,
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        
        return jsonify({
            "error": "Failed to retrieve questions stats",
            "correlation_id": correlation_id
        }), 500


@stats_bp.route('/stats/accuracy', methods=['GET'])
@auth_required
def get_accuracy_stats_endpoint():
    """
    Get accuracy statistics with optional grouping.
    
    Auth: JWT required - Admin for broad queries; user-limited queries for own data
    
    Query Parameters:
        - range: Predefined range (today, last_7_days, etc.) or 'custom'
        - from_date: Custom start date (YYYY-MM-DD) - required if range=custom
        - to_date: Custom end date (YYYY-MM-DD) - required if range=custom
        - groupBy: Optional grouping ('difficulty', 'section', 'week')
        - user_id: Target user ID (admin only, defaults to authenticated user)
    
    Returns:
        JSON response with accuracy stats
        - 200: Successful retrieval
        - 400: Invalid parameters
        - 401: Authentication required
        - 403: Access denied (non-admin accessing other user's data)
        - 500: Server error
    """
    correlation_id = f"accuracy_stats_{g.user_id}_{int(now_utc().timestamp())}"
    
    logger.info("Getting accuracy stats", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "authenticated_user": g.user_id,
            "endpoint": "/api/gamifier/stats/accuracy",
            "method": "GET"
        }
    })
    
    try:
        # Parse query parameters
        range_param = request.args.get('range', 'last_7_days')
        from_date_param = request.args.get('from_date')
        to_date_param = request.args.get('to_date')
        group_by_param = request.args.get('groupBy')
        user_id_param = request.args.get('user_id')
        
        # Validate groupBy parameter
        if group_by_param and group_by_param not in ['difficulty', 'section', 'week']:
            raise ValueError("groupBy must be 'difficulty', 'section', or 'week'")
        
        # Validate and get target user
        target_user_id = _check_admin_or_own_data(user_id_param)
        
        # Parse date range
        from_date, to_date = _parse_date_range(range_param, from_date_param, to_date_param)
        
        # Get accuracy stats
        accuracy_data = compute_accuracy(target_user_id, from_date, to_date, group_by_param)
        
        # Format response for API
        response_data = {
            "overall_accuracy": accuracy_data["overall_accuracy"],
            "total_answers": accuracy_data["total_answers"],
            "correct_answers": accuracy_data["correct_answers"],
            "date_range": accuracy_data["date_range"]
        }
        
        if accuracy_data.get("group_breakdowns"):
            response_data["by_group"] = {}
            for group, stats in accuracy_data["group_breakdowns"].items():
                response_data["by_group"][group] = stats["accuracy"]
        
        logger.info("Successfully retrieved accuracy stats", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "target_user": target_user_id,
                "date_range": f"{from_date} to {to_date}",
                "group_by": group_by_param,
                "overall_accuracy": response_data["overall_accuracy"]
            }
        })
        
        return jsonify(response_data), 200
        
    except ValueError as e:
        logger.warning("Invalid parameters for accuracy stats", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "error": str(e)
            }
        })
        return jsonify({"error": str(e), "correlation_id": correlation_id}), 400
        
    except Exception as e:
        logger.error("Failed to retrieve accuracy stats", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "authenticated_user": g.user_id,
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        
        return jsonify({
            "error": "Failed to retrieve accuracy stats",
            "correlation_id": correlation_id
        }), 500
