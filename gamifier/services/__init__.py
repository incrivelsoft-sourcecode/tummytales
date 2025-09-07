"""
Services package for the Gamifier service.
Contains business logic and external service integrations.
"""

from .embeddings import EmbeddingService
from .rag_service import RAGService
from .similarity_service import (
    is_duplicate,
    add_to_index,
    get_recent_vectors,
    is_duplicate_optimized,
    cleanup_old_vectors,
    get_similarity_stats
)
from .flashcard_service import (
    get_personalized_flashcards,
    flip_flashcard,
    admin_generate_flashcards
)
from .rewards_service import (
    award_badges_if_eligible,
    grant_badge,
    list_badges
)
from .stats_service import (
    compute_accuracy,
    retry_correction_rate,
    points_earned
)

__all__ = [
    'EmbeddingService',
    'RAGService',
    'is_duplicate',
    'add_to_index',
    'get_recent_vectors',
    'is_duplicate_optimized',
    'cleanup_old_vectors',
    'get_similarity_stats',
    'get_personalized_flashcards',
    'flip_flashcard',
    'admin_generate_flashcards',
    'award_badges_if_eligible',
    'grant_badge',
    'list_badges',
    'compute_accuracy',
    'retry_correction_rate',
    'points_earned'
]
