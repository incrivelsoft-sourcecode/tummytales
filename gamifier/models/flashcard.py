"""
Flashcard model for gamification features.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from mongoengine import (
    Document, StringField, IntField, ListField, 
    FloatField, DateTimeField, signals, ValidationError
)
from utils.time_utils import now_utc
from config.logger import get_logger

logger = get_logger(__name__)


class Flashcard(Document):
    """
    Flashcard document for storing user-generated flashcards.
    Uses the same 'tummytales' database as other services.
    """
    
    # Core identification
    user_id = StringField(required=True, max_length=255)
    week = IntField(required=True, min_value=1)
    
    # Content organization
    section = StringField(max_length=200)
    difficulty = StringField(
        choices=['easy', 'medium', 'hard'],
        default='medium',
        max_length=10
    )
    
    # Card content
    front_text = StringField(required=True, min_length=1, max_length=1000)
    back_text = StringField(required=True, min_length=1, max_length=2000)
    
    # RAG and AI processing
    xml = StringField()  # Original XML representation
    rag_chunk_ids = ListField(StringField(max_length=100), default=list)
    embedding_vector = ListField(FloatField(), default=list)
    
    # Timestamps
    created_at = DateTimeField(default=now_utc)
    flipped_at = DateTimeField()  # When the flashcard was flipped/viewed
    
    # MongoDB collection settings
    meta = {
        'collection': 'flashcards',  # Match Node.js naming convention
        'db_alias': 'default',
        'indexes': [
            ('user_id', 'week'),  # Primary compound index for user-week queries
            'user_id',  # User lookup index
            'created_at',  # For temporal queries
            ('user_id', 'difficulty'),  # For difficulty filtering
            ('user_id', 'section'),  # For section filtering
        ]
    }
    
    def __str__(self):
        return f"Flashcard(user_id={self.user_id}, week={self.week}, difficulty={self.difficulty})"
    
    def to_dict(self, include_embedding: bool = False) -> Dict[str, Any]:
        """
        Convert flashcard to API-safe dictionary.
        
        Args:
            include_embedding: Whether to include embedding vector
            
        Returns:
            dict: API-safe representation of flashcard
        """
        try:
            result = {
                'id': str(self.id),
                'user_id': self.user_id,
                'week': self.week,
                'section': self.section or '',
                'difficulty': self.difficulty,
                'front_text': self.front_text,
                'back_text': self.back_text,
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'rag_chunk_ids': list(self.rag_chunk_ids) if self.rag_chunk_ids else []
            }
            
            # Include embedding only if explicitly requested
            if include_embedding and self.embedding_vector:
                result['embedding_vector'] = list(self.embedding_vector)
            
            # Include XML if present
            if self.xml:
                result['xml'] = self.xml
            
            logger.debug(f"Converted flashcard {self.id} to dict (embedding_included={include_embedding})")
            return result
            
        except Exception as e:
            logger.error(f"Failed to convert flashcard {self.id} to dict: {str(e)}")
            raise
    
    def validate_content_length(self) -> None:
        """
        Validate front_text and back_text length requirements.
        
        Raises:
            ValidationError: If content length validation fails
        """
        try:
            # Validate front_text
            if not self.front_text or len(self.front_text.strip()) == 0:
                raise ValidationError("Front text cannot be empty")
            
            if len(self.front_text) > 1000:
                raise ValidationError("Front text exceeds maximum length of 1000 characters")
            
            # Validate back_text
            if not self.back_text or len(self.back_text.strip()) == 0:
                raise ValidationError("Back text cannot be empty")
            
            if len(self.back_text) > 2000:
                raise ValidationError("Back text exceeds maximum length of 2000 characters")
            
            logger.debug(f"Content validation passed for flashcard {self.id or 'new'}")
            
        except Exception as e:
            logger.error(f"Content validation failed for flashcard {self.id or 'new'}: {str(e)}")
            raise
    
    def update_embedding(self, embedding_vector: List[float]) -> None:
        """
        Update the embedding vector for this flashcard.
        
        Args:
            embedding_vector: List of float values representing the embedding
        """
        try:
            if not isinstance(embedding_vector, list):
                raise ValueError("Embedding vector must be a list")
            
            if not all(isinstance(x, (int, float)) for x in embedding_vector):
                raise ValueError("Embedding vector must contain only numeric values")
            
            # Update atomically
            self.update(
                set__embedding_vector=embedding_vector
            )
            
            # Update local instance
            self.embedding_vector = embedding_vector
            
            logger.debug(f"Updated embedding vector for flashcard {self.id} (dimension={len(embedding_vector)})")
            
        except Exception as e:
            logger.error(f"Failed to update embedding for flashcard {self.id}: {str(e)}")
            raise
    
    def add_rag_chunk_ids(self, chunk_ids: List[str]) -> None:
        """
        Add RAG chunk IDs to this flashcard.
        
        Args:
            chunk_ids: List of chunk IDs to associate with this flashcard
        """
        try:
            if not isinstance(chunk_ids, list):
                raise ValueError("Chunk IDs must be a list")
            
            # Filter out duplicates and empty strings
            valid_chunk_ids = [chunk_id for chunk_id in chunk_ids if chunk_id and chunk_id.strip()]
            unique_chunk_ids = list(set(self.rag_chunk_ids + valid_chunk_ids))
            
            # Update atomically
            self.update(
                set__rag_chunk_ids=unique_chunk_ids
            )
            
            # Update local instance
            self.rag_chunk_ids = unique_chunk_ids
            
            logger.debug(f"Updated RAG chunk IDs for flashcard {self.id} (total={len(unique_chunk_ids)})")
            
        except Exception as e:
            logger.error(f"Failed to update RAG chunk IDs for flashcard {self.id}: {str(e)}")
            raise
    
    @classmethod
    def create_flashcard(
        cls,
        user_id: str,
        week: int,
        front_text: str,
        back_text: str,
        section: Optional[str] = None,
        difficulty: str = 'medium',
        xml: Optional[str] = None,
        rag_chunk_ids: Optional[List[str]] = None,
        embedding_vector: Optional[List[float]] = None
    ) -> 'Flashcard':
        """
        Create and save a new flashcard with validation.
        
        Args:
            user_id: User identifier
            week: Week number
            front_text: Front side text
            back_text: Back side text
            section: Section/topic name
            difficulty: Difficulty level
            xml: Original XML representation
            rag_chunk_ids: Associated RAG chunk IDs
            embedding_vector: Embedding vector
            
        Returns:
            Flashcard: Created flashcard instance
            
        Raises:
            ValueError: If validation fails
        """
        try:
            # Create flashcard instance
            flashcard = cls(
                user_id=user_id,
                week=week,
                section=section or '',
                difficulty=difficulty,
                front_text=front_text,
                back_text=back_text,
                xml=xml,
                rag_chunk_ids=rag_chunk_ids or [],
                embedding_vector=embedding_vector or []
            )
            
            # Validate content
            flashcard.validate_content_length()
            
            # Save to database
            flashcard.save()
            
            logger.info(f"Created flashcard {flashcard.id} for user {user_id}, week {week}")
            return flashcard
            
        except Exception as e:
            logger.error(f"Failed to create flashcard for user {user_id}: {str(e)}")
            raise
    
    @classmethod
    def get_user_flashcards(
        cls,
        user_id: str,
        week: Optional[int] = None,
        difficulty: Optional[str] = None,
        section: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List['Flashcard']:
        """
        Get flashcards for a user with optional filters.
        
        Args:
            user_id: User identifier
            week: Week number filter
            difficulty: Difficulty filter
            section: Section filter
            limit: Maximum number of results
            
        Returns:
            List[Flashcard]: List of matching flashcards
        """
        try:
            # Build query filters
            filters = {'user_id': user_id}
            
            if week is not None:
                filters['week'] = week
            
            if difficulty:
                filters['difficulty'] = difficulty
            
            if section:
                filters['section'] = section
            
            # Execute query
            queryset = cls.objects(**filters).order_by('-created_at')
            
            if limit:
                queryset = queryset.limit(limit)
            
            flashcards = list(queryset)
            
            logger.debug(f"Retrieved {len(flashcards)} flashcards for user {user_id}")
            return flashcards
            
        except Exception as e:
            logger.error(f"Failed to get flashcards for user {user_id}: {str(e)}")
            raise
    
    @classmethod
    def get_flashcard_stats(cls, user_id: str, week: Optional[int] = None) -> Dict[str, Any]:
        """
        Get flashcard statistics for a user.
        
        Args:
            user_id: User identifier
            week: Week number filter
            
        Returns:
            dict: Statistics including counts by difficulty, total cards, etc.
        """
        try:
            # Build base query filters
            filters = {'user_id': user_id}
            if week is not None:
                filters['week'] = week
            
            flashcards = cls.objects(**filters)
            
            # Calculate statistics
            total_count = flashcards.count()
            difficulty_counts = {
                'easy': flashcards.filter(difficulty='easy').count(),
                'medium': flashcards.filter(difficulty='medium').count(),
                'hard': flashcards.filter(difficulty='hard').count()
            }
            
            # Get unique weeks
            unique_weeks = flashcards.distinct('week')
            
            # Get unique sections
            unique_sections = flashcards.distinct('section')
            
            stats = {
                'total_count': total_count,
                'difficulty_counts': difficulty_counts,
                'unique_weeks': sorted(unique_weeks),
                'unique_sections': [s for s in unique_sections if s],  # Filter empty sections
                'week_filter': week
            }
            
            logger.debug(f"Generated flashcard stats for user {user_id}: {total_count} total cards")
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get flashcard stats for user {user_id}: {str(e)}")
            raise


# Signal handlers for validation
@signals.pre_save.connect
def validate_flashcard_before_save(sender, document, **kwargs):
    """Validate flashcard content before saving."""
    if isinstance(document, Flashcard):
        try:
            # Validate content length
            document.validate_content_length()
            
            # Ensure created_at is set
            if not document.created_at:
                document.created_at = now_utc()
                
        except Exception as e:
            logger.error(f"Pre-save validation failed for flashcard: {str(e)}")
            raise
