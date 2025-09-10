"""
Stats Pydantic schemas for API request/response validation.
Provides schema definitions for statistics queries and responses.
"""

from datetime import date
from typing import Dict, Optional
from pydantic import BaseModel, Field, field_validator, model_validator
from config.logger import get_logger

logger = get_logger(__name__)


class StatsQuery(BaseModel):
    """
    Schema for statistics query requests.
    Validates user input for stats endpoints with flexible date range options.
    """
    range: str = Field(..., description="Predefined time range for statistics")
    from_date: Optional[date] = Field(None, description="Custom start date (optional)")
    to_date: Optional[date] = Field(None, description="Custom end date (optional)")
    groupBy: Optional[str] = Field(None, description="Group results by specific field")
    
    @field_validator('range')
    @classmethod
    def validate_range(cls, v):
        """Validate range parameter against allowed values."""
        allowed_ranges = [
            'today', 'yesterday', 'this_week', 'last_week', 
            'this_month', 'last_month', 'this_year', 'last_year',
            'last_7_days', 'last_30_days', 'last_90_days',
            'custom'  # For custom date range queries
        ]
        if v not in allowed_ranges:
            raise ValueError(f'range must be one of: {", ".join(allowed_ranges)}')
        return v
    
    @model_validator(mode='after')
    def validate_custom_range_dates(self):
        """Validate that custom range has required dates and proper ordering."""
        # If custom range is selected, dates should be provided
        if self.range == 'custom':
            if self.from_date is None:
                raise ValueError('from_date is required when range is "custom"')
            if self.to_date is None:
                raise ValueError('to_date is required when range is "custom"')
        
        # Ensure to_date is after from_date when both are provided
        if (self.to_date is not None and 
            self.from_date is not None and 
            self.to_date < self.from_date):
            raise ValueError('to_date must be after from_date')
        return self
    
    @field_validator('groupBy')
    @classmethod
    def validate_group_by(cls, v):
        """Validate groupBy parameter against allowed values."""
        if v is not None:
            allowed_groups = [
                'day', 'week', 'month', 'difficulty', 
                'section', 'user_id', 'question_type'
            ]
            if v not in allowed_groups:
                raise ValueError(f'groupBy must be one of: {", ".join(allowed_groups)}')
        return v

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "range": "last_7_days",
                "from_date": None,
                "to_date": None,
                "groupBy": "difficulty"
            }
        }


class AccuracyResponse(BaseModel):
    """
    Schema for accuracy statistics response.
    Provides overall accuracy metrics and optional grouped breakdown.
    """
    overall_accuracy: float = Field(
        ..., 
        ge=0.0, 
        le=1.0, 
        description="Overall accuracy as decimal (0.0 to 1.0)"
    )
    by_group: Optional[Dict[str, float]] = Field(
        None, 
        description="Accuracy breakdown by group (when groupBy is specified)"
    )
    
    @field_validator('overall_accuracy')
    @classmethod
    def validate_accuracy_range(cls, v):
        """Ensure accuracy is within valid percentage range."""
        if not 0.0 <= v <= 1.0:
            raise ValueError('overall_accuracy must be between 0.0 and 1.0')
        return round(v, 4)  # Round to 4 decimal places for consistency
    
    @field_validator('by_group')
    @classmethod
    def validate_group_accuracies(cls, v):
        """Validate that all group accuracies are within valid range."""
        if v is not None:
            for group_key, accuracy in v.items():
                if not isinstance(accuracy, (int, float)):
                    raise ValueError(f'accuracy for group "{group_key}" must be a number')
                if not 0.0 <= accuracy <= 1.0:
                    raise ValueError(f'accuracy for group "{group_key}" must be between 0.0 and 1.0')
                # Round to 4 decimal places for consistency
                v[group_key] = round(accuracy, 4)
        return v

    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "overall_accuracy": 0.8250,
                "by_group": {
                    "easy": 0.9500,
                    "medium": 0.8200,
                    "hard": 0.6800
                }
            }
        }


class StatsSummaryResponse(BaseModel):
    """
    Schema for comprehensive stats summary response.
    """
    accuracy: Dict[str, float] = Field(..., description="Accuracy statistics")
    points_earned: int = Field(..., ge=0, description="Total points earned in period")
    retry_correction_rate: float = Field(..., ge=0.0, le=100.0, description="Retry correction rate percentage")
    quiz_count: int = Field(..., ge=0, description="Number of quizzes completed")
    date_range: Dict[str, str] = Field(..., description="Date range for statistics")
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "accuracy": {
                    "overall": 82.5,
                    "by_difficulty": {
                        "easy": 95.0,
                        "medium": 82.0,
                        "hard": 68.0
                    }
                },
                "points_earned": 450,
                "retry_correction_rate": 75.5,
                "quiz_count": 12,
                "date_range": {
                    "from_date": "2024-03-01",
                    "to_date": "2024-03-07"
                }
            }
        }


class DayStatsResponse(BaseModel):
    """
    Schema for single day statistics response.
    """
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    quiz_count: int = Field(..., ge=0, description="Number of quizzes completed")
    points_earned: int = Field(..., ge=0, description="Points earned on this day")
    accuracy: float = Field(..., ge=0.0, le=100.0, description="Accuracy percentage")
    flashcard_flips: int = Field(..., ge=0, description="Number of flashcard flips")
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "date": "2024-03-15",
                "quiz_count": 2,
                "points_earned": 85,
                "accuracy": 87.5,
                "flashcard_flips": 5
            }
        }


class QuestionsStatsResponse(BaseModel):
    """
    Schema for question-level statistics response.
    """
    total_questions: int = Field(..., ge=0, description="Total questions answered")
    correct_answers: int = Field(..., ge=0, description="Number of correct answers")
    accuracy: float = Field(..., ge=0.0, le=100.0, description="Overall accuracy percentage")
    by_difficulty: Optional[Dict[str, Dict[str, float]]] = Field(None, description="Stats grouped by difficulty")
    by_section: Optional[Dict[str, Dict[str, float]]] = Field(None, description="Stats grouped by section")
    date_range: Dict[str, str] = Field(..., description="Date range for statistics")
    
    class Config:
        """Pydantic model configuration."""
        json_schema_extra = {
            "example": {
                "total_questions": 36,
                "correct_answers": 29,
                "accuracy": 80.6,
                "by_difficulty": {
                    "easy": {"total": 12, "correct": 11, "accuracy": 91.7},
                    "medium": {"total": 15, "correct": 12, "accuracy": 80.0},
                    "hard": {"total": 9, "correct": 6, "accuracy": 66.7}
                },
                "date_range": {
                    "from_date": "2024-03-01",
                    "to_date": "2024-03-07"
                }
            }
        }
