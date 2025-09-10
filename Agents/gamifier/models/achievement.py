"""
Achievement model for tracking available badges and achievements.
"""

from datetime import datetime
from typing import Optional, List
from mongoengine import (
    Document, StringField, DateTimeField
)
from utils.time_utils import now_utc
from config.logger import get_logger

logger = get_logger(__name__)


class Achievement(Document):
    """
    Achievement document for tracking available badges and achievements.
    Defines the master list of achievements that can be awarded to users.
    Uses the same 'tummytales' database as other services.
    """
    
    # Unique achievement code (e.g., 'WEEKLY_STREAK_2025_W12', 'FIRST_QUIZ_COMPLETE')
    code = StringField(required=True, unique=True, max_length=100)
    
    # Human-readable achievement name
    name = StringField(required=True, max_length=200)
    
    # Detailed description of the achievement
    description = StringField(required=True, max_length=500)
    
    # When this achievement was created/defined
    created_at = DateTimeField(required=True, default=now_utc)
    
    # MongoDB collection settings
    meta = {
        'collection': 'achievements',  # Match Node.js naming convention
        'db_alias': 'default',
        'indexes': [
            'code',  # Primary lookup index (unique enforced above)
            'created_at',  # Temporal queries
            'name',  # Name-based searches
        ]
    }
    
    def __str__(self):
        return f"Achievement(code={self.code}, name={self.name})"
    
    def clean(self):
        """
        Validate achievement data before saving.
        """
        try:
            # Normalize code to uppercase for consistency
            if self.code:
                self.code = self.code.upper().strip()
            
            # Trim whitespace from text fields
            if self.name:
                self.name = self.name.strip()
            if self.description:
                self.description = self.description.strip()
            
            # Validate required fields are not empty after trimming
            if not self.code:
                raise ValueError("Achievement code cannot be empty")
            if not self.name:
                raise ValueError("Achievement name cannot be empty")
            if not self.description:
                raise ValueError("Achievement description cannot be empty")
            
            # Validate code format (alphanumeric, underscores, hyphens only)
            import re
            if not re.match(r'^[A-Z0-9_-]+$', self.code):
                raise ValueError(f"Achievement code '{self.code}' must contain only uppercase letters, numbers, underscores, and hyphens")
            
            logger.debug(f"Achievement validation passed for code {self.code}")
            
        except Exception as e:
            logger.error(f"Achievement validation failed for code {self.code}: {str(e)}")
            raise
    
    def to_dict(self) -> dict:
        """
        Convert Achievement to API-safe dictionary representation.
        
        Returns:
            dict: Achievement data suitable for API responses
        """
        try:
            return {
                'id': str(self.id),
                'code': self.code,
                'name': self.name,
                'description': self.description,
                'created_at': self.created_at.isoformat() if self.created_at else None,
            }
        except Exception as e:
            logger.error(f"Failed to convert Achievement {self.id} to dict: {str(e)}")
            raise
    
    @classmethod
    def fetch_by_code(cls, code: str) -> Optional['Achievement']:
        """
        Fetch an achievement by its unique code.
        
        Args:
            code: The achievement code to look up
            
        Returns:
            Achievement or None: The achievement if found, None otherwise
        """
        try:
            # Normalize the code for lookup
            normalized_code = code.upper().strip() if code else ''
            
            if not normalized_code:
                logger.warning("Attempted to fetch achievement with empty code")
                return None
            
            achievement = cls.objects(code=normalized_code).first()
            
            if achievement:
                logger.debug(f"Found achievement for code {normalized_code}")
            else:
                logger.debug(f"No achievement found for code {normalized_code}")
                
            return achievement
            
        except Exception as e:
            logger.error(f"Failed to fetch achievement by code {code}: {str(e)}")
            return None
    
    @classmethod
    def fetch_by_codes(cls, codes: List[str]) -> List['Achievement']:
        """
        Fetch multiple achievements by their codes.
        
        Args:
            codes: List of achievement codes to look up
            
        Returns:
            list: List of Achievement documents found
        """
        try:
            if not codes:
                return []
            
            # Normalize all codes
            normalized_codes = [code.upper().strip() for code in codes if code and code.strip()]
            
            if not normalized_codes:
                logger.warning("Attempted to fetch achievements with no valid codes")
                return []
            
            achievements = cls.objects(code__in=normalized_codes).order_by('name')
            achievement_list = list(achievements)
            
            logger.debug(f"Found {len(achievement_list)} achievements for {len(normalized_codes)} codes")
            return achievement_list
            
        except Exception as e:
            logger.error(f"Failed to fetch achievements by codes {codes}: {str(e)}")
            return []
    
    @classmethod
    def get_all_achievements(cls, limit: Optional[int] = None) -> List['Achievement']:
        """
        Get all achievements, optionally limited.
        
        Args:
            limit: Optional limit on number of achievements to return
            
        Returns:
            list: List of all Achievement documents
        """
        try:
            query = cls.objects.order_by('name')
            
            if limit and limit > 0:
                query = query.limit(limit)
            
            achievements = list(query)
            
            logger.debug(f"Retrieved {len(achievements)} achievements (limit: {limit})")
            return achievements
            
        except Exception as e:
            logger.error(f"Failed to retrieve all achievements: {str(e)}")
            return []
    
    @classmethod
    def exists_by_code(cls, code: str) -> bool:
        """
        Check if an achievement with the given code exists.
        
        Args:
            code: The achievement code to check
            
        Returns:
            bool: True if achievement exists, False otherwise
        """
        try:
            normalized_code = code.upper().strip() if code else ''
            
            if not normalized_code:
                return False
            
            exists = cls.objects(code=normalized_code).count() > 0
            
            logger.debug(f"Achievement code {normalized_code} exists: {exists}")
            return exists
            
        except Exception as e:
            logger.error(f"Failed to check if achievement exists by code {code}: {str(e)}")
            return False
    
    @classmethod
    def create_achievement(cls, code: str, name: str, description: str) -> Optional['Achievement']:
        """
        Create a new achievement if it doesn't already exist.
        
        Args:
            code: Unique achievement code
            name: Human-readable name
            description: Detailed description
            
        Returns:
            Achievement or None: Created achievement or None if creation failed
        """
        try:
            # Check if achievement already exists
            if cls.exists_by_code(code):
                logger.warning(f"Achievement with code {code} already exists")
                return cls.fetch_by_code(code)
            
            # Create new achievement
            achievement = cls(
                code=code,
                name=name,
                description=description
            )
            
            achievement.save()
            
            logger.info(f"Created new achievement: {code} - {name}")
            return achievement
            
        except Exception as e:
            logger.error(f"Failed to create achievement {code}: {str(e)}")
            return None
