"""
Stats Service for computing user performance analytics and statistics.
Provides accuracy calculations, retry correction rates, and points tracking.
"""

import time
from datetime import datetime, date
from typing import Dict, List, Optional, Any, Union

from models.answer import Answer
from models.quiz_session import QuizSession
from models.question import Question
from models.activity_log import ActivityLog, ACTIVITY_TYPES
from utils.constants import SESSION_STATUS
from utils.time_utils import now_utc
from config.logger import get_logger

logger = get_logger(__name__)


def compute_accuracy(
    user_id: str, 
    from_date: Union[date, datetime], 
    to_date: Union[date, datetime], 
    group_by: Optional[str] = None
) -> Dict[str, Any]:
    """
    Compute user accuracy for quiz answers in a date range with optional grouping.
    
    Args:
        user_id: The user ID to compute accuracy for
        from_date: Start date for the range (inclusive)
        to_date: End date for the range (inclusive)
        group_by: Optional grouping ('section', 'difficulty', 'week', None)
        
    Returns:
        dict: Overall accuracy and group breakdowns if requested
        
    Raises:
        ValueError: If invalid date range or group_by parameter
    """
    correlation_id = f"compute_accuracy_{user_id}_{from_date}_{to_date}_{int(time.time())}"
    
    logger.info("Computing user accuracy", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": user_id,
            "from_date": from_date.isoformat() if hasattr(from_date, 'isoformat') else str(from_date),
            "to_date": to_date.isoformat() if hasattr(to_date, 'isoformat') else str(to_date),
            "group_by": group_by
        }
    })
    
    try:
        # Validate inputs
        if not user_id or not user_id.strip():
            raise ValueError("User ID is required")
        
        # Convert dates to datetime if needed
        if isinstance(from_date, date) and not isinstance(from_date, datetime):
            from_datetime = datetime.combine(from_date, datetime.min.time().replace(tzinfo=now_utc().tzinfo))
        else:
            from_datetime = from_date
            
        if isinstance(to_date, date) and not isinstance(to_date, datetime):
            to_datetime = datetime.combine(to_date, datetime.max.time().replace(tzinfo=now_utc().tzinfo))
        else:
            to_datetime = to_date
        
        if from_datetime > to_datetime:
            raise ValueError("from_date cannot be after to_date")
        
        # Validate group_by parameter
        valid_group_by = ['section', 'difficulty', 'week', None]
        if group_by not in valid_group_by:
            raise ValueError(f"Invalid group_by: {group_by}. Must be one of {valid_group_by}")
        
        logger.debug("Finding quiz sessions in date range", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "from_datetime": from_datetime.isoformat(),
                "to_datetime": to_datetime.isoformat()
            }
        })
        
        # Step 1: Find quiz sessions in the date range
        quiz_sessions = QuizSession.objects(
            user_id=user_id,
            started_at__gte=from_datetime,
            started_at__lte=to_datetime,
            status=SESSION_STATUS["COMPLETED"]
        )
        
        session_ids = [str(session.id) for session in quiz_sessions]
        
        if not session_ids:
            logger.info("No completed quiz sessions found in date range", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id
                }
            })
            return {
                "overall_accuracy": 0.0,
                "total_answers": 0,
                "correct_answers": 0,
                "group_breakdowns": {} if group_by else None
            }
        
        # Step 2: Query Answer documents for these sessions
        answers = Answer.objects(session_id__in=session_ids)
        
        if not answers:
            logger.info("No answers found for sessions", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id,
                    "session_count": len(session_ids)
                }
            })
            return {
                "overall_accuracy": 0.0,
                "total_answers": 0,
                "correct_answers": 0,
                "group_breakdowns": {} if group_by else None
            }
        
        # Step 3: If grouping required, get question details
        question_data = {}
        if group_by:
            question_ids = list(set(answer.question_id for answer in answers))
            questions = Question.objects(id__in=question_ids)
            question_data = {str(q.id): q for q in questions}
            
            logger.debug("Retrieved question data for grouping", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id,
                    "question_count": len(question_data)
                }
            })
        
        # Step 4: Calculate overall accuracy
        total_answers = len(answers)
        correct_answers = sum(1 for answer in answers if answer.is_correct)
        overall_accuracy = (correct_answers / total_answers) * 100 if total_answers > 0 else 0.0
        
        result = {
            "overall_accuracy": round(overall_accuracy, 2),
            "total_answers": total_answers,
            "correct_answers": correct_answers,
            "date_range": {
                "from_date": from_date.isoformat() if hasattr(from_date, 'isoformat') else str(from_date),
                "to_date": to_date.isoformat() if hasattr(to_date, 'isoformat') else str(to_date)
            }
        }
        
        # Step 5: Calculate group breakdowns if requested
        if group_by:
            group_breakdowns = {}
            
            for answer in answers:
                question = question_data.get(answer.question_id)
                if not question:
                    continue
                
                # Get group key based on group_by parameter
                if group_by == 'section':
                    group_key = question.section or 'Unknown'
                elif group_by == 'difficulty':
                    group_key = question.difficulty or 'Unknown'
                elif group_by == 'week':
                    group_key = str(question.week)
                else:
                    continue
                
                # Initialize group if not exists
                if group_key not in group_breakdowns:
                    group_breakdowns[group_key] = {
                        "total_answers": 0,
                        "correct_answers": 0,
                        "accuracy": 0.0
                    }
                
                # Update group stats
                group_breakdowns[group_key]["total_answers"] += 1
                if answer.is_correct:
                    group_breakdowns[group_key]["correct_answers"] += 1
            
            # Calculate accuracy for each group
            for group_key, stats in group_breakdowns.items():
                if stats["total_answers"] > 0:
                    stats["accuracy"] = round(
                        (stats["correct_answers"] / stats["total_answers"]) * 100, 
                        2
                    )
            
            result["group_breakdowns"] = group_breakdowns
        else:
            result["group_breakdowns"] = None
        
        logger.info("Successfully computed user accuracy", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "overall_accuracy": result["overall_accuracy"],
                "total_answers": result["total_answers"],
                "group_count": len(result["group_breakdowns"]) if result["group_breakdowns"] else 0
            }
        })
        
        return result
        
    except Exception as e:
        logger.error("Failed to compute user accuracy", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "error": str(e)
            }
        })
        raise


def retry_correction_rate(
    user_id: str, 
    from_date: Union[date, datetime], 
    to_date: Union[date, datetime]
) -> Dict[str, Any]:
    """
    Compute retry correction rate - how often user corrects wrong answers on retry.
    
    Args:
        user_id: The user ID to compute rate for
        from_date: Start date for the range (inclusive)
        to_date: End date for the range (inclusive)
        
    Returns:
        dict: Retry correction statistics
        
    Raises:
        ValueError: If invalid date range
    """
    correlation_id = f"retry_correction_{user_id}_{from_date}_{to_date}_{int(time.time())}"
    
    logger.info("Computing retry correction rate", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": user_id,
            "from_date": from_date.isoformat() if hasattr(from_date, 'isoformat') else str(from_date),
            "to_date": to_date.isoformat() if hasattr(to_date, 'isoformat') else str(to_date)
        }
    })
    
    try:
        # Validate inputs
        if not user_id or not user_id.strip():
            raise ValueError("User ID is required")
        
        # Convert dates to datetime if needed
        if isinstance(from_date, date) and not isinstance(from_date, datetime):
            from_datetime = datetime.combine(from_date, datetime.min.time().replace(tzinfo=now_utc().tzinfo))
        else:
            from_datetime = from_date
            
        if isinstance(to_date, date) and not isinstance(to_date, datetime):
            to_datetime = datetime.combine(to_date, datetime.max.time().replace(tzinfo=now_utc().tzinfo))
        else:
            to_datetime = to_date
        
        if from_datetime > to_datetime:
            raise ValueError("from_date cannot be after to_date")
        
        # Find quiz sessions in the date range
        quiz_sessions = QuizSession.objects(
            user_id=user_id,
            started_at__gte=from_datetime,
            started_at__lte=to_datetime,
            status=SESSION_STATUS["COMPLETED"]
        )
        
        session_ids = [str(session.id) for session in quiz_sessions]
        
        if not session_ids:
            return {
                "retry_correction_rate": 0.0,
                "total_retries": 0,
                "successful_corrections": 0,
                "date_range": {
                    "from_date": from_date.isoformat() if hasattr(from_date, 'isoformat') else str(from_date),
                    "to_date": to_date.isoformat() if hasattr(to_date, 'isoformat') else str(to_date)
                }
            }
        
        # Get all answers for these sessions, grouped by question
        answers = Answer.objects(session_id__in=session_ids).order_by('session_id', 'question_id', 'retry_index')
        
        # Group answers by question to analyze retry patterns
        question_attempts = {}
        for answer in answers:
            key = (answer.session_id, answer.question_id)
            if key not in question_attempts:
                question_attempts[key] = []
            question_attempts[key].append(answer)
        
        # Analyze retry corrections
        total_retries = 0
        successful_corrections = 0
        
        for attempts in question_attempts.values():
            if len(attempts) < 2:
                continue  # No retries for this question
            
            # Sort by retry_index to ensure proper order
            attempts.sort(key=lambda x: x.retry_index)
            
            for i in range(1, len(attempts)):
                current_attempt = attempts[i]
                previous_attempt = attempts[i-1]
                
                # Count as a retry if retry_index is higher
                if current_attempt.retry_index > previous_attempt.retry_index:
                    total_retries += 1
                    
                    # Count as successful correction if previous was wrong and current is correct
                    if not previous_attempt.is_correct and current_attempt.is_correct:
                        successful_corrections += 1
        
        # Calculate correction rate
        correction_rate = (successful_corrections / total_retries * 100) if total_retries > 0 else 0.0
        
        result = {
            "retry_correction_rate": round(correction_rate, 2),
            "total_retries": total_retries,
            "successful_corrections": successful_corrections,
            "date_range": {
                "from_date": from_date.isoformat() if hasattr(from_date, 'isoformat') else str(from_date),
                "to_date": to_date.isoformat() if hasattr(to_date, 'isoformat') else str(to_date)
            }
        }
        
        logger.info("Successfully computed retry correction rate", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "correction_rate": result["retry_correction_rate"],
                "total_retries": result["total_retries"],
                "successful_corrections": result["successful_corrections"]
            }
        })
        
        return result
        
    except Exception as e:
        logger.error("Failed to compute retry correction rate", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "error": str(e)
            }
        })
        raise


def points_earned(
    user_id: str, 
    from_date: Union[date, datetime], 
    to_date: Union[date, datetime]
) -> Dict[str, Any]:
    """
    Compute total points earned by user in a date range.
    
    Args:
        user_id: The user ID to compute points for
        from_date: Start date for the range (inclusive)
        to_date: End date for the range (inclusive)
        
    Returns:
        dict: Points earned statistics broken down by activity type
        
    Raises:
        ValueError: If invalid date range
    """
    correlation_id = f"points_earned_{user_id}_{from_date}_{to_date}_{int(time.time())}"
    
    logger.info("Computing points earned", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": user_id,
            "from_date": from_date.isoformat() if hasattr(from_date, 'isoformat') else str(from_date),
            "to_date": to_date.isoformat() if hasattr(to_date, 'isoformat') else str(to_date)
        }
    })
    
    try:
        # Validate inputs
        if not user_id or not user_id.strip():
            raise ValueError("User ID is required")
        
        # Convert dates to datetime if needed
        if isinstance(from_date, date) and not isinstance(from_date, datetime):
            from_datetime = datetime.combine(from_date, datetime.min.time().replace(tzinfo=now_utc().tzinfo))
        else:
            from_datetime = from_date
            
        if isinstance(to_date, date) and not isinstance(to_date, datetime):
            to_datetime = datetime.combine(to_date, datetime.max.time().replace(tzinfo=now_utc().tzinfo))
        else:
            to_datetime = to_date
        
        if from_datetime > to_datetime:
            raise ValueError("from_date cannot be after to_date")
        
        # Query ActivityLog for point-earning activities
        activities = ActivityLog.objects(
            user_id=user_id,
            ts__gte=from_datetime,
            ts__lte=to_datetime,
            points_delta__gt=0  # Only positive point changes
        )
        
        # Aggregate points by activity type
        points_by_type = {}
        total_points = 0
        
        for activity in activities:
            activity_type = activity.type
            points_delta = activity.points_delta
            
            if activity_type not in points_by_type:
                points_by_type[activity_type] = {
                    "points": 0,
                    "count": 0
                }
            
            points_by_type[activity_type]["points"] += points_delta
            points_by_type[activity_type]["count"] += 1
            total_points += points_delta
        
        result = {
            "total_points_earned": total_points,
            "points_by_activity": points_by_type,
            "activity_count": len(activities),
            "date_range": {
                "from_date": from_date.isoformat() if hasattr(from_date, 'isoformat') else str(from_date),
                "to_date": to_date.isoformat() if hasattr(to_date, 'isoformat') else str(to_date)
            }
        }
        
        logger.info("Successfully computed points earned", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "total_points": result["total_points_earned"],
                "activity_types": list(points_by_type.keys()),
                "activity_count": result["activity_count"]
            }
        })
        
        return result
        
    except Exception as e:
        logger.error("Failed to compute points earned", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "error": str(e)
            }
        })
        raise


def get_stats_summary(user_id: str, from_date: Union[date, datetime], to_date: Union[date, datetime]) -> Dict[str, Any]:
    """
    Get comprehensive stats summary for a user in a date range.
    
    Args:
        user_id: The user ID to get stats for
        from_date: Start date for the range (inclusive)
        to_date: End date for the range (inclusive)
        
    Returns:
        dict: Comprehensive stats summary
    """
    correlation_id = f"stats_summary_{user_id}_{from_date}_{to_date}_{int(time.time())}"
    
    logger.info("Getting stats summary", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": user_id,
            "from_date": from_date.isoformat() if hasattr(from_date, 'isoformat') else str(from_date),
            "to_date": to_date.isoformat() if hasattr(to_date, 'isoformat') else str(to_date)
        }
    })
    
    try:
        # Get accuracy stats
        accuracy_stats = compute_accuracy(user_id, from_date, to_date, group_by='difficulty')
        
        # Get retry correction rate
        retry_stats = retry_correction_rate(user_id, from_date, to_date)
        
        # Get points earned
        points_stats = points_earned(user_id, from_date, to_date)
        
        # Count completed quizzes in range
        from_datetime = datetime.combine(from_date, datetime.min.time().replace(tzinfo=now_utc().tzinfo)) if isinstance(from_date, date) else from_date
        to_datetime = datetime.combine(to_date, datetime.max.time().replace(tzinfo=now_utc().tzinfo)) if isinstance(to_date, date) else to_date
        
        quiz_count = QuizSession.objects(
            user_id=user_id,
            started_at__gte=from_datetime,
            started_at__lte=to_datetime,
            status=SESSION_STATUS["COMPLETED"]
        ).count()
        
        # Get flashcard-specific stats from activity logs
        flashcard_activities = ActivityLog.objects(
            user_id=user_id,
            ts__gte=from_datetime,
            ts__lte=to_datetime,
            type=ACTIVITY_TYPES['FLASHCARD_FLIP']
        )
        flashcards_flipped = len(flashcard_activities)
        
        # Format response with quiz_stats and flashcard_stats expected by tests
        result = {
            "accuracy": {
                "overall": accuracy_stats["overall_accuracy"],
                "by_difficulty": accuracy_stats.get("group_breakdowns", {})
            },
            "points_earned": points_stats["total_points_earned"],
            "retry_correction_rate": retry_stats["retry_correction_rate"],
            "quiz_count": quiz_count,
            "quiz_stats": {
                "correct_answers": accuracy_stats["correct_answers"],
                "total_answers": accuracy_stats["total_answers"],
                "accuracy": accuracy_stats["overall_accuracy"]
            },
            "flashcard_stats": {
                "flashcards_flipped": flashcards_flipped
            },
            "date_range": {
                "from_date": from_date.isoformat() if hasattr(from_date, 'isoformat') else str(from_date),
                "to_date": to_date.isoformat() if hasattr(to_date, 'isoformat') else str(to_date)
            }
        }
        
        logger.info("Successfully retrieved stats summary", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "quiz_count": result["quiz_count"],
                "points_earned": result["points_earned"]
            }
        })
        
        return result
        
    except Exception as e:
        logger.error("Failed to get stats summary", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "error": str(e)
            }
        })
        raise


def get_day_stats(user_id: str, target_date: date) -> Dict[str, Any]:
    """
    Get statistics for a specific day.
    
    Args:
        user_id: The user ID to get stats for
        target_date: The specific date to get stats for
        
    Returns:
        dict: Day-specific statistics
    """
    correlation_id = f"day_stats_{user_id}_{target_date}_{int(time.time())}"
    
    logger.info("Getting day stats", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": user_id,
            "target_date": target_date.isoformat()
        }
    })
    
    try:
        # Use same date for from and to to get single day
        from_datetime = datetime.combine(target_date, datetime.min.time().replace(tzinfo=now_utc().tzinfo))
        to_datetime = datetime.combine(target_date, datetime.max.time().replace(tzinfo=now_utc().tzinfo))
        
        # Get accuracy for the day
        accuracy_stats = compute_accuracy(user_id, from_datetime, to_datetime)
        
        # Get points for the day
        points_stats = points_earned(user_id, from_datetime, to_datetime)
        
        # Count quizzes for the day
        quiz_count = QuizSession.objects(
            user_id=user_id,
            started_at__gte=from_datetime,
            started_at__lte=to_datetime,
            status=SESSION_STATUS["COMPLETED"]
        ).count()
        
        # Count flashcard flips for the day
        flashcard_activities = ActivityLog.objects(
            user_id=user_id,
            ts__gte=from_datetime,
            ts__lte=to_datetime,
            type=ACTIVITY_TYPES["FLASHCARD_FLIP"]
        ).count()
        
        result = {
            "date": target_date.isoformat(),
            "quiz_count": quiz_count,
            "points_earned": points_stats["total_points_earned"],
            "accuracy": accuracy_stats["overall_accuracy"],
            "flashcard_flips": flashcard_activities
        }
        
        logger.info("Successfully retrieved day stats", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "target_date": target_date.isoformat(),
                "quiz_count": result["quiz_count"],
                "points_earned": result["points_earned"]
            }
        })
        
        return result
        
    except Exception as e:
        logger.error("Failed to get day stats", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "target_date": target_date.isoformat(),
                "error": str(e)
            }
        })
        raise


def get_questions_stats(user_id: str, from_date: Union[date, datetime], to_date: Union[date, datetime], group_by: Optional[str] = None) -> Dict[str, Any]:
    """
    Get detailed question-level statistics.
    
    Args:
        user_id: The user ID to get stats for
        from_date: Start date for the range (inclusive)
        to_date: End date for the range (inclusive)
        group_by: Optional grouping ('difficulty', 'section', etc.)
        
    Returns:
        dict: Question-level statistics
    """
    correlation_id = f"questions_stats_{user_id}_{from_date}_{to_date}_{int(time.time())}"
    
    logger.info("Getting questions stats", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": user_id,
            "from_date": from_date.isoformat() if hasattr(from_date, 'isoformat') else str(from_date),
            "to_date": to_date.isoformat() if hasattr(to_date, 'isoformat') else str(to_date),
            "group_by": group_by
        }
    })
    
    try:
        # Get accuracy stats with optional grouping
        accuracy_stats = compute_accuracy(user_id, from_date, to_date, group_by=group_by)
        
        result = {
            "total_questions": accuracy_stats["total_answers"],
            "correct_answers": accuracy_stats["correct_answers"],
            "accuracy": accuracy_stats["overall_accuracy"],
            "date_range": accuracy_stats["date_range"]
        }
        
        # Add grouped breakdown if available
        if accuracy_stats.get("group_breakdowns"):
            if group_by == "difficulty":
                result["by_difficulty"] = {}
                for group, stats in accuracy_stats["group_breakdowns"].items():
                    result["by_difficulty"][group] = {
                        "total": stats["total_answers"],
                        "correct": stats["correct_answers"],
                        "accuracy": stats["accuracy"]
                    }
            elif group_by == "section":
                result["by_section"] = {}
                for group, stats in accuracy_stats["group_breakdowns"].items():
                    result["by_section"][group] = {
                        "total": stats["total_answers"],
                        "correct": stats["correct_answers"],
                        "accuracy": stats["accuracy"]
                    }
        
        logger.info("Successfully retrieved questions stats", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "total_questions": result["total_questions"],
                "accuracy": result["accuracy"]
            }
        })
        
        return result
        
    except Exception as e:
        logger.error("Failed to get questions stats", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "error": str(e)
            }
        })
        raise
