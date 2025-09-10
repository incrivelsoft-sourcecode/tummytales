"""
Time utility functions for the Gamifier service.
"""

import pytz
from datetime import datetime, timedelta, timezone
from typing import Optional, Union
from dateutil import parser


def now_utc() -> datetime:
    """
    Get current UTC datetime with timezone info.
    
    Returns:
        datetime: Current UTC datetime with timezone info
    """
    return datetime.now(timezone.utc)


def to_iso(dt: datetime) -> str:
    """
    Convert datetime to ISO string format.
    
    Args:
        dt: Datetime object to convert
        
    Returns:
        str: ISO format datetime string
    """
    return dt.isoformat()


def parse_iso(iso_string: str) -> datetime:
    """
    Parse ISO format datetime string to datetime object.
    
    Args:
        iso_string: ISO format datetime string
        
    Returns:
        datetime: Parsed datetime object with timezone info
        
    Raises:
        ValueError: If string cannot be parsed
    """
    try:
        dt = parser.isoparse(iso_string)
        # Ensure timezone aware
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid ISO datetime string: {iso_string}") from e


def add_minutes(dt: datetime, minutes: int) -> datetime:
    """
    Add minutes to a datetime.
    
    Args:
        dt: Base datetime
        minutes: Number of minutes to add (can be negative)
        
    Returns:
        datetime: New datetime with minutes added
    """
    return dt + timedelta(minutes=minutes)


def days_between(dt1: datetime, dt2: datetime) -> int:
    """
    Calculate the number of days between two datetimes.
    
    Args:
        dt1: First datetime
        dt2: Second datetime
        
    Returns:
        int: Number of days between dates (positive if dt2 is after dt1)
    """
    # Convert to dates to ignore time component
    date1 = dt1.date()
    date2 = dt2.date()
    return (date2 - date1).days


def start_of_day(dt: datetime, timezone_str: str = "UTC") -> datetime:
    """
    Get the start of day (00:00:00) for a given datetime in specified timezone.
    
    Args:
        dt: Input datetime
        timezone_str: Timezone string (e.g., "UTC", "America/Chicago")
        
    Returns:
        datetime: Start of day in the specified timezone
    """
    try:
        tz = pytz.timezone(timezone_str)
    except pytz.UnknownTimeZoneError:
        tz = pytz.UTC
    
    # Convert to the target timezone
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=pytz.UTC)
    
    local_dt = dt.astimezone(tz)
    # Get start of day in local timezone
    start_local = local_dt.replace(hour=0, minute=0, second=0, microsecond=0)
    # Convert back to UTC
    return start_local.astimezone(pytz.UTC)


def is_same_day(dt1: datetime, dt2: datetime, timezone_str: str = "UTC") -> bool:
    """
    Check if two datetimes are on the same calendar day in the specified timezone.
    
    Args:
        dt1: First datetime
        dt2: Second datetime
        timezone_str: Timezone string for comparison
        
    Returns:
        bool: True if both datetimes are on the same day
    """
    try:
        tz = pytz.timezone(timezone_str)
    except pytz.UnknownTimeZoneError:
        tz = pytz.UTC
    
    # Ensure timezone aware
    if dt1.tzinfo is None:
        dt1 = dt1.replace(tzinfo=pytz.UTC)
    if dt2.tzinfo is None:
        dt2 = dt2.replace(tzinfo=pytz.UTC)
    
    # Convert to target timezone and compare dates
    local_dt1 = dt1.astimezone(tz)
    local_dt2 = dt2.astimezone(tz)
    
    return local_dt1.date() == local_dt2.date()


def reset_limits_if_needed(user_profile) -> bool:
    """
    Check if daily limits need to be reset based on last reset time.
    Updates the user profile if reset is needed.
    
    Args:
        user_profile: UserGameProfile instance with limits field
        
    Returns:
        bool: True if limits were reset, False otherwise
    """
    current_time = now_utc()
    last_reset = user_profile.limits.get("last_reset_at")
    
    # If no last reset time, or it's None, reset now
    if not last_reset:
        _reset_user_limits(user_profile, current_time)
        return True
    
    # Parse last reset time if it's a string
    if isinstance(last_reset, str):
        try:
            last_reset = parse_iso(last_reset)
        except ValueError:
            # Invalid format, reset now
            _reset_user_limits(user_profile, current_time)
            return True
    
    # Check if it's a new day in the user's timezone
    user_timezone = getattr(user_profile, 'timezone', 'UTC')
    
    if not is_same_day(last_reset, current_time, user_timezone):
        _reset_user_limits(user_profile, current_time)
        return True
    
    return False


def _reset_user_limits(user_profile, reset_time: datetime) -> None:
    """
    Reset user daily limits.
    
    Args:
        user_profile: UserGameProfile instance
        reset_time: Time when reset occurred
    """
    user_profile.limits["quizzes_today"] = 0
    user_profile.limits["flips_today"] = 0
    user_profile.limits["last_reset_at"] = reset_time
    
    # Also reset daily points
    if hasattr(user_profile, 'points') and isinstance(user_profile.points, dict):
        user_profile.points["today"] = 0


def get_user_local_time(user_timezone: str = "UTC") -> datetime:
    """
    Get current time in user's timezone.
    
    Args:
        user_timezone: User's timezone string
        
    Returns:
        datetime: Current time in user's timezone
    """
    try:
        tz = pytz.timezone(user_timezone)
    except pytz.UnknownTimeZoneError:
        tz = pytz.UTC
    
    utc_now = now_utc()
    return utc_now.astimezone(tz)


def is_time_in_range(current_time: datetime, start_hour: int, end_hour: int, 
                    timezone_str: str = "UTC") -> bool:
    """
    Check if current time falls within a specific hour range.
    
    Args:
        current_time: Time to check
        start_hour: Start hour (0-23)
        end_hour: End hour (0-23)
        timezone_str: Timezone for comparison
        
    Returns:
        bool: True if time is in range
    """
    try:
        tz = pytz.timezone(timezone_str)
    except pytz.UnknownTimeZoneError:
        tz = pytz.UTC
    
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=pytz.UTC)
    
    local_time = current_time.astimezone(tz)
    hour = local_time.hour
    
    if start_hour <= end_hour:
        return start_hour <= hour < end_hour
    else:  # Range crosses midnight
        return hour >= start_hour or hour < end_hour
