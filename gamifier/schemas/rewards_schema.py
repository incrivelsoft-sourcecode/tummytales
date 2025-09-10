"""
Rewards Pydantic schemas for API request/response validation.
"""

from typing import List
from pydantic import BaseModel, Field
from config.logger import get_logger

logger = get_logger(__name__)


class BadgesResponse(BaseModel):
    """
    Schema for user badges response.
    Returns list of badge codes the user has earned.
    """
    badges: List[str] = Field(..., description="List of badge codes earned by the user")
    total_count: int = Field(..., ge=0, description="Total number of badges")
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "badges": ["WEEKLY_STREAK_2024_W12", "FIRST_QUIZ", "PERFECT_SCORE"],
                "total_count": 3
            }
        }
