"""
Flashcard Pydantic schemas for API request/response validation.
Follows the existing MongoDB model structure and naming conventions.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, validator
from config.logger import get_logger

logger = get_logger(__name__)


class FlashcardCreateRequest(BaseModel):
    """
    Schema for creating a new flashcard.
    Validates user input for flashcard creation endpoint.
    """
    week: int = Field(..., ge=1, le=52, description="Week number (1-52)")
    section: Optional[str] = Field(None, max_length=200, description="Content section/topic")
    difficulty: Optional[str] = Field("medium", description="Difficulty level")
    front_text: Optional[str] = Field(None, min_length=1, max_length=1000, description="Front side text")
    back_text: Optional[str] = Field(None, min_length=1, max_length=2000, description="Back side text")
    
    @validator('difficulty')
    def validate_difficulty(cls, v):
        """Validate difficulty level matches available options."""
        if v is not None and v not in ['easy', 'medium', 'hard']:
            raise ValueError('difficulty must be one of: easy, medium, hard')
        return v
    
    @validator('section')
    def validate_section(cls, v):
        """Validate section is not empty if provided."""
        if v is not None and v.strip() == '':
            raise ValueError('section cannot be empty string')
        return v.strip() if v else None
    
    @validator('front_text', 'back_text')
    def validate_text_content(cls, v):
        """Validate text content is not empty if provided."""
        if v is not None and v.strip() == '':
            raise ValueError('text content cannot be empty string')
        return v.strip() if v else None

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "week": 1,
                "section": "Nutrition Basics",
                "difficulty": "medium",
                "front_text": "What are the three main macronutrients?",
                "back_text": "Carbohydrates, Proteins, and Fats"
            }
        }


class FlashcardResponse(BaseModel):
    """
    Schema for flashcard response data.
    Returns minimal necessary information for API consumers.
    """
    id: str = Field(..., description="Unique flashcard identifier")
    user_id: str = Field(..., description="User who created the flashcard")
    week: int = Field(..., description="Week number")
    section: Optional[str] = Field(None, description="Content section/topic")
    difficulty: str = Field(..., description="Difficulty level")
    front_text: str = Field(..., description="Front side text")
    back_text: str = Field(..., description="Back side text")
    created_at: datetime = Field(..., description="Creation timestamp")

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "id": "64f1a2b3c4d5e6f7g8h9i0j1",
                "user_id": "64e1a2b3c4d5e6f7g8h9i0j1",
                "week": 1,
                "section": "Nutrition Basics",
                "difficulty": "medium",
                "front_text": "What are the three main macronutrients?",
                "back_text": "Carbohydrates, Proteins, and Fats",
                "created_at": "2025-09-05T10:30:00Z"
            }
        }
