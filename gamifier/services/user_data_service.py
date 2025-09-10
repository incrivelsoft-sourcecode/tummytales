"""
User Data Service for fetching user profiles and survey data from external services.
Handles communication with user management service and caches results.
"""

import json
import time
import math
from datetime import datetime, date
from typing import Dict, Optional, Any
import requests
from requests.exceptions import RequestException, Timeout

from config.env_loader import get_config
from config.logger import get_logger
from utils.time_utils import now_utc

logger = get_logger(__name__)

# Cache configuration
USER_PROFILE_CACHE_TTL = 300  # 5 minutes in seconds
_user_profile_cache = {}


class UserDataServiceError(Exception):
    """Custom exception for user data service errors."""
    pass


class NetworkTimeoutError(UserDataServiceError):
    """Raised when network requests timeout."""
    pass


def get_user_profile(user_id: str, token: Optional[str] = None) -> Dict[str, Any]:
    """
    Get comprehensive user profile including survey data.
    Implements caching to reduce external API calls.
    
    Args:
        user_id: The user ID to fetch profile for
        
    Returns:
        dict: User profile containing user details and survey data
        
    Raises:
        UserDataServiceError: If user data cannot be retrieved
        NetworkTimeoutError: If request times out
    """
    correlation_id = f"user_profile_{user_id}_{int(time.time())}"
    
    logger.info("Fetching user profile", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": user_id
        }
    })
    
    # Check cache first
    cache_key = f"user_profile_{user_id}"
    cached_result = _get_from_cache(cache_key)
    if cached_result:
        logger.info("Returning cached user profile", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "cache_hit": True
            }
        })
        return cached_result
    
    try:
        # Fetch user details and survey data
        user_details = _fetch_user_details(user_id, correlation_id, token)
        survey_data = fetch_survey(user_id, token)
        
        # Combine data
        user_profile = {
            "user_id": user_id,
            "user_details": user_details,
            "survey_data": survey_data,
            "current_week": None,  # Will be computed if LMP available
            "fetched_at": now_utc().isoformat()
        }
        
        # Compute current week if LMP is available
        if survey_data and "pregnancyStatus" in survey_data:
            lmp_date = extract_lmp_date(survey_data["pregnancyStatus"])
            if lmp_date:
                user_profile["current_week"] = compute_current_week(lmp_date)
                logger.info("Computed current week from LMP", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "user_id": user_id,
                        "lmp_date": lmp_date.isoformat(),
                        "current_week": user_profile["current_week"]
                    }
                })
            else:
                user_profile["current_week"] = 1  # Default fallback
                logger.warning("No LMP date found, using default week", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "user_id": user_id,
                        "fallback_week": 1
                    }
                })
        else:
            user_profile["current_week"] = 1  # Default fallback
            logger.warning("No pregnancy status found, using default week", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id,
                    "fallback_week": 1
                }
            })
        
        # Cache the result
        _store_in_cache(cache_key, user_profile)
        
        logger.info("Successfully fetched and cached user profile", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "current_week": user_profile["current_week"],
                "has_survey_data": bool(survey_data)
            }
        })
        
        return user_profile
        
    except NetworkTimeoutError:
        # Re-raise timeout errors
        raise
    except Exception as e:
        logger.error("Failed to fetch user profile", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "error": str(e)
            }
        })
        
        # Return minimal fallback profile
        fallback_profile = {
            "user_id": user_id,
            "user_details": None,
            "survey_data": None,
            "current_week": 1,  # Safe fallback
            "fetched_at": now_utc().isoformat(),
            "error": "Failed to fetch user data"
        }
        
        logger.warning("Returning fallback user profile", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "fallback_week": 1
            }
        })
        
        return fallback_profile


def fetch_survey(user_id: str, token: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Fetch raw survey document for a user using the correct authenticated endpoint.
    
    Args:
        user_id: The user ID to fetch survey for
        token: JWT token for authentication
        
    Returns:
        dict or None: Raw survey document if found, None otherwise
        
    Raises:
        NetworkTimeoutError: If request times out
    """
    correlation_id = f"survey_{user_id}_{int(time.time())}"
    config = get_config()
    
    logger.info("Fetching user survey", extra={
        "extra_fields": {
            "correlation_id": correlation_id,
            "user_id": user_id,
            "has_token": bool(token)
        }
    })
    
    # If no token provided, return None early to avoid authentication errors
    if not token:
        logger.warning("No authentication token provided for survey fetch", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id
            }
        })
        return None
    
    try:
        # Make request to user service for survey data using the correct endpoint
        url = f"{config.USER_SERVICE_URL}/user/mom/all/surveys"
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
            "X-Correlation-ID": correlation_id
        }
        
        logger.info("Making authenticated request to user service", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "url": url,
                "token_length": len(token) if token else 0
            }
        })
        
        response = requests.get(
            url,
            timeout=10,  # 10 second timeout
            headers=headers
        )
        
        logger.info("Received response from user service", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "status_code": response.status_code,
                "response_length": len(response.text) if response.text else 0
            }
        })
        
        if response.status_code == 200:
            response_data = response.json()
            # The /user/mom/all/surveys endpoint returns {success: true, surveys: [...]}
            if response_data.get("success") and response_data.get("surveys"):
                surveys = response_data["surveys"]
                if surveys and len(surveys) > 0:
                    # Return the first (most recent) survey
                    survey_data = surveys[0]
                    logger.info("Successfully fetched survey data", extra={
                        "extra_fields": {
                            "correlation_id": correlation_id,
                            "user_id": user_id,
                            "survey_keys": list(survey_data.keys()) if survey_data else [],
                            "surveys_count": len(surveys)
                        }
                    })
                    return survey_data
                else:
                    logger.info("No surveys found for user", extra={
                        "extra_fields": {
                            "correlation_id": correlation_id,
                            "user_id": user_id
                        }
                    })
                    return None
            else:
                logger.warning("Unexpected response format from survey endpoint", extra={
                    "extra_fields": {
                        "correlation_id": correlation_id,
                        "user_id": user_id,
                        "response_keys": list(response_data.keys()) if response_data else [],
                        "response_data": str(response_data)[:200]
                    }
                })
                return None
        
        elif response.status_code == 401:
            logger.error("Authentication failed for survey endpoint", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id,
                    "status_code": 401,
                    "response_text": response.text[:200],
                    "token_provided": bool(token)
                }
            })
            # Return None so fallback logic can be used
            return None
            
        elif response.status_code == 404:
            logger.info("No survey found for user", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id,
                    "status_code": 404
                }
            })
            return None
            
        else:
            logger.warning("Unexpected response from survey endpoint", extra={
                "extra_fields": {
                    "correlation_id": correlation_id,
                    "user_id": user_id,
                    "status_code": response.status_code,
                    "response_text": response.text[:200]  # Log first 200 chars
                }
            })
            return None
            
    except Timeout as e:
        logger.error("Survey request timed out", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "error": str(e)
            }
        })
        raise NetworkTimeoutError(f"Survey request timed out for user {user_id}")
        
    except RequestException as e:
        logger.error("Network error fetching survey", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        return None
        
    except Exception as e:
        logger.error("Unexpected error fetching survey", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "error": str(e),
                "error_type": type(e).__name__
            }
        })
        return None


def compute_current_week(lmp_date: date) -> int:
    """
    Compute current pregnancy week from Last Menstrual Period (LMP) date.
    Formula: floor((today - LMP).days / 7) + 1, clamped between 1 and 40.
    
    Args:
        lmp_date: Last Menstrual Period date
        
    Returns:
        int: Current pregnancy week (1-40)
    """
    if not isinstance(lmp_date, date):
        raise ValueError("lmp_date must be a date object")
    
    today = now_utc().date()
    days_since_lmp = (today - lmp_date).days
    
    # Calculate week using the standard formula
    week = math.floor(days_since_lmp / 7) + 1
    
    # Clamp between 1 and 40
    week = max(1, min(40, week))
    
    logger.debug("Computed pregnancy week", extra={
        "extra_fields": {
            "lmp_date": lmp_date.isoformat(),
            "today": today.isoformat(),
            "days_since_lmp": days_since_lmp,
            "computed_week": week
        }
    })
    
    return week


def _fetch_user_details(user_id: str, correlation_id: str, token: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Fetch user details from user management service.
    
    Args:
        user_id: The user ID to fetch
        correlation_id: Correlation ID for tracking
        
    Returns:
        dict or None: User details if found, None otherwise
        
    Raises:
        NetworkTimeoutError: If request times out
    """
    config = get_config()
    
    try:
        # Note: For now, we'll skip user details since we don't have a working endpoint
        # The main focus is on getting survey data for pregnancy week calculation
        logger.info("Skipping user details fetch - focusing on survey data", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id
            }
        })
        return None
        
    except Exception as e:
        logger.error("Error in user details fetch", extra={
            "extra_fields": {
                "correlation_id": correlation_id,
                "user_id": user_id,
                "error": str(e)
            }
        })
        return None


def extract_lmp_date(pregnancy_status: Dict[str, Any]) -> Optional[date]:
    """
    Extract LMP date from pregnancy status data.
    
    Args:
        pregnancy_status: Pregnancy status dictionary from survey
        
    Returns:
        date or None: LMP date if found and valid, None otherwise
    """
    try:
        lmp_value = pregnancy_status.get("Last_menstrualperiod")
        
        if not lmp_value:
            return None
            
        # Handle different date formats
        if isinstance(lmp_value, str):
            # Parse ISO format or other common formats
            try:
                # Try ISO format first
                parsed_date = datetime.fromisoformat(lmp_value.replace('Z', '+00:00'))
                return parsed_date.date()
            except ValueError:
                # Try other formats if needed
                logger.warning("Could not parse LMP date string", extra={
                    "extra_fields": {
                        "lmp_value": lmp_value
                    }
                })
                return None
                
        elif isinstance(lmp_value, datetime):
            return lmp_value.date()
            
        elif isinstance(lmp_value, date):
            return lmp_value
            
        else:
            logger.warning("Unexpected LMP date type", extra={
                "extra_fields": {
                    "lmp_type": type(lmp_value).__name__,
                    "lmp_value": str(lmp_value)
                }
            })
            return None
            
    except Exception as e:
        logger.warning("Error extracting LMP date", extra={
            "extra_fields": {
                "error": str(e),
                "pregnancy_status_keys": list(pregnancy_status.keys()) if pregnancy_status else []
            }
        })
        return None


def _get_from_cache(cache_key: str) -> Optional[Dict[str, Any]]:
    """
    Get item from in-memory cache if not expired.
    
    Args:
        cache_key: Cache key to lookup
        
    Returns:
        dict or None: Cached data if found and not expired, None otherwise
    """
    if cache_key not in _user_profile_cache:
        return None
        
    cached_item = _user_profile_cache[cache_key]
    cache_timestamp = cached_item.get("cached_at", 0)
    
    # Check if cache has expired
    if time.time() - cache_timestamp > USER_PROFILE_CACHE_TTL:
        # Remove expired item
        del _user_profile_cache[cache_key]
        return None
        
    return cached_item.get("data")


def _store_in_cache(cache_key: str, data: Dict[str, Any]) -> None:
    """
    Store item in in-memory cache with timestamp.
    
    Args:
        cache_key: Cache key to store under
        data: Data to cache
    """
    _user_profile_cache[cache_key] = {
        "data": data,
        "cached_at": time.time()
    }
    
    # Simple cache cleanup - remove expired items if cache gets too large
    if len(_user_profile_cache) > 100:  # Arbitrary limit
        current_time = time.time()
        expired_keys = [
            key for key, item in _user_profile_cache.items()
            if current_time - item.get("cached_at", 0) > USER_PROFILE_CACHE_TTL
        ]
        
        for key in expired_keys:
            del _user_profile_cache[key]


def clear_user_cache(user_id: Optional[str] = None) -> None:
    """
    Clear user profile cache.
    
    Args:
        user_id: If provided, clear only this user's cache. If None, clear all cache.
    """
    if user_id:
        cache_key = f"user_profile_{user_id}"
        if cache_key in _user_profile_cache:
            del _user_profile_cache[cache_key]
            logger.info("Cleared user cache", extra={
                "extra_fields": {
                    "user_id": user_id
                }
            })
    else:
        _user_profile_cache.clear()
        logger.info("Cleared all user cache")
