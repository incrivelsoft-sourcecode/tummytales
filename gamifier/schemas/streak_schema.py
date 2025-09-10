"""
Streak Pydantic schemas for API request/response validation.
"""

from datetime import date
from typing import Optional
from pydantic import BaseModel, Field
from config.logger import get_logger

logger = get_logger(__name__)


class StreakResponse(BaseModel):
    """
    Schema for streak information response.
    Returns current streak information for a user.
    """
    current_streak: int = Field(..., ge=0, description="Current consecutive quiz days")
    longest_streak: int = Field(..., ge=0, description="Longest streak ever achieved")
    last_quiz_date: Optional[str] = Field(None, description="Last quiz completion date (YYYY-MM-DD format)")
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "current_streak": 5,
                "longest_streak": 12,
                "last_quiz_date": "2024-03-15"
            }
        }
