"""
Similarity Index model for tracking content embeddings to prevent duplicates.
"""

from datetime import datetime
from typing import List, Optional
from mongoengine import (
    Document, StringField, IntField, ListField, FloatField, DateTimeField
)
from utils.time_utils import now_utc
from config.logger import get_logger

logger = get_logger(__name__)

# Content type constants
CONTENT_TYPES = {
    'FLASHCARD': 'flashcard',
    'QUIZ': 'quiz',
}


class SimilarityIndex(Document):
    """
    Similarity index document for tracking content embeddings to prevent duplicates.
    Stores embedding vectors for similarity comparison during content generation.
    Uses the same 'tummytales' database as other services.
    """
    
    # Core user and temporal identification
    user_id = StringField(required=True, max_length=255)
    week = IntField(required=True, min_value=1, max_value=40)
    
    # Content type classification
    content_type = StringField(
        required=True,
        choices=[
            CONTENT_TYPES['FLASHCARD'],
            CONTENT_TYPES['QUIZ'],
        ],
        max_length=20
    )
    
    # Hash of the original text content for quick comparison
    text_hash = StringField(required=True, max_length=128)
    
    # Embedding vector for similarity computation
    embedding_vector = ListField(FloatField(), required=True)
    
    # When this embedding was created
    created_at = DateTimeField(required=True, default=now_utc)
    
    # MongoDB collection settings
    meta = {
        'collection': 'similarity_indexes',  # Match Node.js naming convention
        'db_alias': 'default',
        'indexes': [
            ('user_id', 'week', 'content_type'),  # Primary compound index as specified
            'user_id',  # User lookup index
            ('user_id', 'content_type'),  # User content type queries
            'created_at',  # Temporal cleanup queries
            'text_hash',  # Hash-based duplicate detection
            ('week', 'content_type'),  # Week-based content queries
        ]
    }
    
    def __str__(self):
        return f"SimilarityIndex(user_id={self.user_id}, week={self.week}, type={self.content_type}, vector_dim={len(self.embedding_vector) if self.embedding_vector else 0})"
    
    def clean(self):
        """
        Validate similarity index data before saving.
        """
        try:
            # Validate week range
            if self.week < 1 or self.week > 40:
                raise ValueError(f"Week must be between 1 and 40, got {self.week}")
            
            # Validate embedding vector
            if not self.embedding_vector:
                raise ValueError("Embedding vector cannot be empty")
            
            # Validate vector dimensions (common embedding sizes)
            vector_dim = len(self.embedding_vector)
            common_dims = [384, 512, 768, 1024, 1536]  # Common embedding dimensions
            if vector_dim not in common_dims:
                logger.warning(f"Unusual embedding dimension: {vector_dim} for user {self.user_id}")
            
            # Validate text hash
            if not self.text_hash or len(self.text_hash.strip()) == 0:
                raise ValueError("Text hash cannot be empty")
            
            # Normalize text hash
            self.text_hash = self.text_hash.strip().lower()
            
            logger.debug(f"SimilarityIndex validation passed for user {self.user_id}, week {self.week}, type {self.content_type}")
            
        except Exception as e:
            logger.error(f"SimilarityIndex validation failed for user {self.user_id}: {str(e)}")
            raise
    
    def to_dict(self, include_vector: bool = False) -> dict:
        """
        Convert SimilarityIndex to API-safe dictionary representation.
        
        Args:
            include_vector: Whether to include the embedding vector (default: False for performance)
            
        Returns:
            dict: SimilarityIndex data suitable for API responses
        """
        try:
            result = {
                'id': str(self.id),
                'user_id': self.user_id,
                'week': self.week,
                'content_type': self.content_type,
                'text_hash': self.text_hash,
                'vector_dimension': len(self.embedding_vector) if self.embedding_vector else 0,
                'created_at': self.created_at.isoformat() if self.created_at else None,
            }
            
            if include_vector and self.embedding_vector:
                result['embedding_vector'] = self.embedding_vector
                
            return result
            
        except Exception as e:
            logger.error(f"Failed to convert SimilarityIndex {self.id} to dict: {str(e)}")
            raise
    
    @staticmethod
    def fetch_vectors_for_user_week(user_id: str, week: int, content_type: str) -> List[List[float]]:
        """
        Fetch all embedding vectors for a specific user, week, and content type.
        
        Args:
            user_id: The user ID
            week: The pregnancy week (1-40)
            content_type: The content type ('flashcard' or 'quiz')
            
        Returns:
            list: List of embedding vectors (each vector is a list of floats)
        """
        try:
            # Validate inputs
            if not user_id or not user_id.strip():
                logger.warning("fetch_vectors_for_user_week called with empty user_id")
                return []
            
            if week < 1 or week > 40:
                logger.warning(f"fetch_vectors_for_user_week called with invalid week: {week}")
                return []
            
            if content_type not in CONTENT_TYPES.values():
                logger.warning(f"fetch_vectors_for_user_week called with invalid content_type: {content_type}")
                return []
            
            # Query similarity indexes
            similarity_indexes = SimilarityIndex.objects(
                user_id=user_id,
                week=week,
                content_type=content_type
            ).only('embedding_vector').order_by('-created_at')
            
            # Extract vectors
            vectors = []
            for index in similarity_indexes:
                if index.embedding_vector:
                    vectors.append(index.embedding_vector)
            
            logger.debug(f"Retrieved {len(vectors)} vectors for user {user_id}, week {week}, type {content_type}")
            return vectors
            
        except Exception as e:
            logger.error(f"Failed to fetch vectors for user {user_id}, week {week}, type {content_type}: {str(e)}")
            return []
    
    @staticmethod
    def fetch_recent_vectors_for_user(user_id: str, content_type: str, limit: int = 200) -> List[List[float]]:
        """
        Fetch recent embedding vectors for a user across all weeks (for performance optimization).
        
        Args:
            user_id: The user ID
            content_type: The content type ('flashcard' or 'quiz')
            limit: Maximum number of vectors to return (default: 200)
            
        Returns:
            list: List of recent embedding vectors
        """
        try:
            if not user_id or not user_id.strip():
                logger.warning("fetch_recent_vectors_for_user called with empty user_id")
                return []
            
            if content_type not in CONTENT_TYPES.values():
                logger.warning(f"fetch_recent_vectors_for_user called with invalid content_type: {content_type}")
                return []
            
            # Query recent similarity indexes
            similarity_indexes = SimilarityIndex.objects(
                user_id=user_id,
                content_type=content_type
            ).only('embedding_vector').order_by('-created_at').limit(limit)
            
            # Extract vectors
            vectors = []
            for index in similarity_indexes:
                if index.embedding_vector:
                    vectors.append(index.embedding_vector)
            
            logger.debug(f"Retrieved {len(vectors)} recent vectors for user {user_id}, type {content_type} (limit: {limit})")
            return vectors
            
        except Exception as e:
            logger.error(f"Failed to fetch recent vectors for user {user_id}, type {content_type}: {str(e)}")
            return []
    
    @classmethod
    def add_vector(cls, user_id: str, week: int, content_type: str, 
                   text_hash: str, embedding_vector: List[float]) -> Optional['SimilarityIndex']:
        """
        Add a new embedding vector to the similarity index.
        
        Args:
            user_id: The user ID
            week: The pregnancy week
            content_type: The content type
            text_hash: Hash of the original text
            embedding_vector: The embedding vector
            
        Returns:
            SimilarityIndex or None: Created index or None if creation failed
        """
        try:
            # Create new similarity index
            similarity_index = cls(
                user_id=user_id,
                week=week,
                content_type=content_type,
                text_hash=text_hash,
                embedding_vector=embedding_vector
            )
            
            similarity_index.save()
            
            logger.info(f"Added similarity vector for user {user_id}, week {week}, type {content_type}")
            return similarity_index
            
        except Exception as e:
            logger.error(f"Failed to add similarity vector for user {user_id}: {str(e)}")
            return None
    
    @classmethod
    def get_user_vector_count(cls, user_id: str, content_type: Optional[str] = None) -> int:
        """
        Get the count of vectors for a user, optionally filtered by content type.
        
        Args:
            user_id: The user ID
            content_type: Optional content type filter
            
        Returns:
            int: Count of vectors
        """
        try:
            query = cls.objects(user_id=user_id)
            
            if content_type:
                query = query.filter(content_type=content_type)
            
            count = query.count()
            
            logger.debug(f"User {user_id} has {count} vectors (type: {content_type})")
            return count
            
        except Exception as e:
            logger.error(f"Failed to get vector count for user {user_id}: {str(e)}")
            return 0
    
    @classmethod
    def cleanup_old_vectors(cls, user_id: str, content_type: str, keep_recent: int = 1000) -> int:
        """
        Clean up old vectors for a user to prevent unlimited growth.
        
        Args:
            user_id: The user ID
            content_type: The content type
            keep_recent: Number of recent vectors to keep (default: 1000)
            
        Returns:
            int: Number of vectors deleted
        """
        try:
            # Get all vectors for user/type, ordered by creation time (newest first)
            all_vectors = cls.objects(
                user_id=user_id,
                content_type=content_type
            ).order_by('-created_at')
            
            total_count = all_vectors.count()
            
            if total_count <= keep_recent:
                logger.debug(f"No cleanup needed for user {user_id}, type {content_type} ({total_count} <= {keep_recent})")
                return 0
            
            # Get vectors to delete (skip the most recent ones)
            vectors_to_delete = all_vectors.skip(keep_recent)
            delete_count = vectors_to_delete.count()
            
            # Delete old vectors
            vectors_to_delete.delete()
            
            logger.info(f"Cleaned up {delete_count} old vectors for user {user_id}, type {content_type}")
            return delete_count
            
        except Exception as e:
            logger.error(f"Failed to cleanup old vectors for user {user_id}: {str(e)}")
            return 0
