"""
Embedding service for text vectorization using sentence transformers.
Provides text embedding functionality with caching and error handling.
"""

import time
from functools import lru_cache
from typing import List, Optional, Union
import numpy as np
from sentence_transformers import SentenceTransformer
from config.logger import get_logger

logger = get_logger(__name__)


class EmbeddingService:
    """
    Service for generating text embeddings using sentence transformers.
    Includes LRU caching for recent embeddings and robust error handling.
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the embedding service with specified model.
        
        Args:
            model_name: Name of the sentence transformer model to use
        """
        self.model_name = model_name
        self.model: Optional[SentenceTransformer] = None
        self.expected_dim: Optional[int] = None
        self._max_retries = 3
        self._retry_delay = 1.0  # seconds
        
        logger.info(
            "Initializing EmbeddingService",
            extra={
                "extra_fields": {
                    "model_name": model_name,
                    "max_retries": self._max_retries
                }
            }
        )
        
        # Load model with retries
        self._load_model_with_retries()
    
    def _load_model_with_retries(self) -> None:
        """Load the sentence transformer model with retry logic."""
        for attempt in range(self._max_retries):
            try:
                logger.info(
                    f"Loading embedding model (attempt {attempt + 1}/{self._max_retries})",
                    extra={
                        "extra_fields": {
                            "model_name": self.model_name,
                            "attempt": attempt + 1
                        }
                    }
                )
                
                self.model = SentenceTransformer(self.model_name)
                
                # Test model and get expected dimension
                test_embedding = self.model.encode("test", convert_to_numpy=True)
                self.expected_dim = len(test_embedding)
                
                logger.info(
                    "Embedding model loaded successfully",
                    extra={
                        "extra_fields": {
                            "model_name": self.model_name,
                            "embedding_dimension": self.expected_dim
                        }
                    }
                )
                return
                
            except Exception as e:
                logger.error(
                    f"Failed to load embedding model (attempt {attempt + 1})",
                    extra={
                        "extra_fields": {
                            "model_name": self.model_name,
                            "attempt": attempt + 1,
                            "error": str(e)
                        }
                    }
                )
                
                if attempt < self._max_retries - 1:
                    time.sleep(self._retry_delay * (2 ** attempt))  # Exponential backoff
                else:
                    raise RuntimeError(f"Failed to load embedding model after {self._max_retries} attempts: {e}")
    
    @lru_cache(maxsize=128)
    def _cached_embed_text(self, text: str) -> tuple:
        """
        Internal cached embedding method.
        Returns tuple to make it hashable for LRU cache.
        """
        if not self.model:
            raise RuntimeError("Embedding model not loaded")
        
        logger.debug(
            "Computing embedding for text",
            extra={
                "extra_fields": {
                    "text_length": len(text),
                    "text_preview": text[:100] + "..." if len(text) > 100 else text
                }
            }
        )
        
        try:
            # Convert to numpy array for consistency
            embedding = self.model.encode(text, convert_to_numpy=True)
            return tuple(embedding.tolist())  # Convert to tuple for caching
            
        except Exception as e:
            logger.error(
                "Failed to compute embedding",
                extra={
                    "extra_fields": {
                        "text_length": len(text),
                        "error": str(e)
                    }
                }
            )
            raise RuntimeError(f"Failed to compute embedding: {e}")
    
    def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding for a single text string.
        
        Args:
            text: Input text to embed
            
        Returns:
            List of float values representing the text embedding
            
        Raises:
            RuntimeError: If model is not loaded or embedding fails
            ValueError: If text is empty or invalid
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty or whitespace only")
        
        # Use cached method and convert back to list
        cached_result = self._cached_embed_text(text.strip())
        return list(cached_result)
    
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embeddings for a batch of texts.
        
        Args:
            texts: List of input texts to embed
            
        Returns:
            List of embeddings, each as a list of float values
            
        Raises:
            RuntimeError: If model is not loaded or embedding fails
            ValueError: If texts list is empty or contains invalid texts
        """
        if not texts:
            raise ValueError("Texts list cannot be empty")
        
        # Validate and clean texts
        cleaned_texts = []
        for i, text in enumerate(texts):
            if not text or not text.strip():
                raise ValueError(f"Text at index {i} cannot be empty or whitespace only")
            cleaned_texts.append(text.strip())
        
        logger.info(
            "Computing batch embeddings",
            extra={
                "extra_fields": {
                    "batch_size": len(cleaned_texts),
                    "total_chars": sum(len(t) for t in cleaned_texts)
                }
            }
        )
        
        if not self.model:
            raise RuntimeError("Embedding model not loaded")
        
        try:
            # Use batch encoding for efficiency
            embeddings = self.model.encode(cleaned_texts, convert_to_numpy=True, batch_size=32)
            
            # Convert numpy arrays to lists
            result = [embedding.tolist() for embedding in embeddings]
            
            logger.info(
                "Batch embeddings computed successfully",
                extra={
                    "extra_fields": {
                        "batch_size": len(result),
                        "embedding_dimension": len(result[0]) if result else 0
                    }
                }
            )
            
            return result
            
        except Exception as e:
            logger.error(
                "Failed to compute batch embeddings",
                extra={
                    "extra_fields": {
                        "batch_size": len(cleaned_texts),
                        "error": str(e)
                    }
                }
            )
            raise RuntimeError(f"Failed to compute batch embeddings: {e}")
    
    def validate_vector_dim(self, vector: Union[List[float], np.ndarray]) -> bool:
        """
        Validate that a vector has the expected dimensions.
        
        Args:
            vector: Vector to validate (list or numpy array)
            
        Returns:
            True if vector has correct dimensions, False otherwise
            
        Raises:
            RuntimeError: If model is not loaded
        """
        if not self.model or self.expected_dim is None:
            raise RuntimeError("Embedding model not loaded or dimension not determined")
        
        try:
            # Handle numpy arrays
            if hasattr(vector, 'shape'):
                vector_dim = vector.shape[0] if len(vector.shape) == 1 else vector.shape[-1]
            else:
                vector_dim = len(vector)
            
            is_valid = vector_dim == self.expected_dim
            
            logger.debug(
                "Vector dimension validation",
                extra={
                    "extra_fields": {
                        "vector_dim": vector_dim,
                        "expected_dim": self.expected_dim,
                        "is_valid": is_valid
                    }
                }
            )
            
            return is_valid
            
        except Exception as e:
            logger.error(
                "Failed to validate vector dimensions",
                extra={
                    "extra_fields": {
                        "error": str(e)
                    }
                }
            )
            return False
    
    def get_model_info(self) -> dict:
        """
        Get information about the loaded model.
        
        Returns:
            Dictionary containing model information
        """
        return {
            "model_name": self.model_name,
            "is_loaded": self.model is not None,
            "expected_dimension": self.expected_dim,
            "cache_info": self._cached_embed_text.cache_info()._asdict()
        }
    
    def clear_cache(self) -> None:
        """Clear the embedding cache."""
        self._cached_embed_text.cache_clear()
        logger.info("Embedding cache cleared")
