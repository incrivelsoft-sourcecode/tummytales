"""
RAG (Retrieval-Augmented Generation) service for Pinecone vector database operations.
Provides vectorized content storage and retrieval functionality for quiz and flashcard generation.
"""

import time
from typing import List, Dict, Optional, Union, Any
from datetime import datetime, timezone
import logging

from config.logger import get_logger
from config.env_loader import get_config

logger = get_logger(__name__)


class RAGService:
    """
    RAGService provides a wrapper around Pinecone for vector operations.
    Handles chunk storage, retrieval, and filtering for the gamifier service.
    Supports unit testing through dependency injection and mocking.
    """
    
    def __init__(self, api_key: Optional[str] = None, env: Optional[str] = None, 
                 index_name: Optional[str] = None, pinecone_client=None):
        """
        Initialize the RAG service with Pinecone configuration.
        
        Args:
            api_key: Pinecone API key (defaults to config)
            env: Pinecone environment (defaults to config)
            index_name: Pinecone index name (defaults to config)
            pinecone_client: Pre-configured Pinecone client for testing (optional)
        """
        # Load config if parameters not provided
        config = get_config()
        
        self.api_key = api_key or config.PINECONE_API_KEY
        self.env = env or config.PINECONE_ENV
        self.index_name = index_name or config.PINECONE_INDEX_NAME
        
        # Allow injection for testing
        self._pinecone_client = pinecone_client
        self._index = None
        self._is_initialized = False
        
        logger.info(
            "Initializing RAGService",
            extra={
                "extra_fields": {
                    "index_name": self.index_name,
                    "environment": self.env,
                    "has_custom_client": pinecone_client is not None
                }
            }
        )
        
        # Initialize Pinecone connection
        self._init_pinecone()
    
    def _init_pinecone(self) -> None:
        """Initialize Pinecone client and connection."""
        try:
            if self._pinecone_client:
                # Use injected client (for testing)
                self.pc = self._pinecone_client
                # For test cases, try to set up the index
                try:
                    self._index = self.pc.Index(self.index_name)
                    self._is_initialized = True
                except Exception:
                    # Handle index creation failure for testing
                    self._index = None
                    self._is_initialized = False
            else:
                # Initialize real Pinecone client
                import pinecone
                
                try:
                    # Try newer Pinecone version
                    from pinecone import Pinecone
                    self.pc = Pinecone(api_key=self.api_key)
                    logger.info("Using newer Pinecone client")
                except ImportError:
                    # Fall back to older version
                    pinecone.init(api_key=self.api_key, environment=self.env)
                    self.pc = pinecone
                    logger.info("Using legacy Pinecone client")
                
                # For real clients, call init_index
                self.init_index()
            
            logger.info(
                "Pinecone client initialized successfully",
                extra={
                    "extra_fields": {
                        "index_name": self.index_name
                    }
                }
            )
            
        except Exception as e:
            logger.error(
                "Failed to initialize Pinecone client",
                extra={
                    "extra_fields": {
                        "error": str(e),
                        "index_name": self.index_name
                    }
                }
            )
            raise RuntimeError(f"Failed to initialize Pinecone client: {e}")
    
    def init_index(self) -> bool:
        """
        Ensure the Pinecone index exists with proper metadata schema.
        Creates index if it doesn't exist.
        
        Returns:
            bool: True if index is ready, False otherwise
        """
        try:
            logger.info(
                "Initializing Pinecone index",
                extra={
                    "extra_fields": {
                        "index_name": self.index_name
                    }
                }
            )
            
            # Check if index exists
            existing_indexes = self._list_indexes()
            index_names = [idx.name if hasattr(idx, 'name') else idx for idx in existing_indexes]
            
            if self.index_name not in index_names:
                logger.info(
                    "Index does not exist, creating new index",
                    extra={
                        "extra_fields": {
                            "index_name": self.index_name,
                            "dimension": 384,  # all-MiniLM-L6-v2 dimension
                            "metric": "cosine"
                        }
                    }
                )
                
                # Create index with metadata schema
                self._create_index()
                
                # Wait for index to be ready
                self._wait_for_index_ready()
            
            # Get index reference
            self._index = self._get_index()
            self._is_initialized = True
            
            logger.info(
                "Index initialized successfully",
                extra={
                    "extra_fields": {
                        "index_name": self.index_name,
                        "is_ready": True
                    }
                }
            )
            
            return True
            
        except Exception as e:
            logger.error(
                "Failed to initialize index",
                extra={
                    "extra_fields": {
                        "index_name": self.index_name,
                        "error": str(e)
                    }
                }
            )
            return False
    
    def _list_indexes(self) -> List[Any]:
        """List all available indexes."""
        if hasattr(self.pc, 'list_indexes'):
            return self.pc.list_indexes()
        else:
            # Legacy version
            return self.pc.list_indexes()
    
    def _create_index(self) -> None:
        """Create a new Pinecone index with metadata schema."""
        index_config = {
            "dimension": 384,  # all-MiniLM-L6-v2 embedding dimension
            "metric": "cosine",
            "metadata_config": {
                "indexed": ["week", "section", "content_type", "user_id"]
            }
        }
        
        if hasattr(self.pc, 'create_index'):
            # Newer version
            self.pc.create_index(
                name=self.index_name,
                **index_config
            )
        else:
            # Legacy version
            self.pc.create_index(
                index_name=self.index_name,
                **index_config
            )
    
    def _wait_for_index_ready(self, timeout: int = 60) -> None:
        """Wait for index to be ready."""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            try:
                index = self._get_index()
                stats = index.describe_index_stats()
                logger.info("Index is ready")
                return
            except Exception:
                logger.info("Waiting for index to be ready...")
                time.sleep(5)
        
        raise RuntimeError(f"Index not ready after {timeout} seconds")
    
    def _get_index(self):
        """Get index reference."""
        if hasattr(self.pc, 'Index'):
            # Newer version
            return self.pc.Index(self.index_name)
        else:
            # Legacy version
            return self.pc.Index(self.index_name)
    
    def upsert_chunks(self, chunks: List[Dict[str, Any]]) -> bool:
        """
        Upsert chunks into the Pinecone index.
        
        Args:
            chunks: List of chunk dictionaries with keys:
                   - id: unique identifier
                   - text: content text
                   - week: pregnancy week (1-40)
                   - section: content section (optional)
                   - metadata: additional metadata (optional)
                   
        Returns:
            bool: True if successful, False otherwise
        """
        if not self._is_initialized:
            logger.error("RAGService not initialized. Call init_index() first.")
            return False
        
        if not chunks:
            logger.warning("No chunks provided for upsert")
            return True
        
        try:
            logger.info(
                "Upserting chunks to index",
                extra={
                    "extra_fields": {
                        "chunk_count": len(chunks),
                        "index_name": self.index_name
                    }
                }
            )
            
            # Prepare vectors for upsert
            vectors = []
            for chunk in chunks:
                # Validate required fields - check both top level and metadata
                chunk_id = chunk.get('id')
                chunk_text = chunk.get('text')
                chunk_week = chunk.get('week') or chunk.get('metadata', {}).get('week')
                
                if not all([chunk_id, chunk_text, chunk_week]):
                    logger.error(f"Invalid chunk missing required fields: {chunk}")
                    continue
                
                # Prepare metadata - merge chunk metadata with top-level fields
                chunk_metadata = chunk.get('metadata', {})
                metadata = {
                    'text': chunk_text,
                    'week': chunk_week,
                    'section': chunk.get('section') or chunk_metadata.get('section', ''),
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    **chunk_metadata  # Include all metadata fields
                }
                
                # Note: embedding_vector should be provided in chunk
                if 'embedding_vector' not in chunk:
                    logger.error(f"Chunk {chunk['id']} missing embedding_vector")
                    continue
                
                vectors.append({
                    'id': chunk['id'],
                    'values': chunk['embedding_vector'],
                    'metadata': metadata
                })
            
            if not vectors:
                logger.warning("No valid vectors to upsert")
                return False
            
            # Upsert in batches
            batch_size = 100
            for i in range(0, len(vectors), batch_size):
                batch = vectors[i:i + batch_size]
                self._index.upsert(vectors=batch)
                
                logger.debug(
                    f"Upserted batch {i//batch_size + 1}",
                    extra={
                        "extra_fields": {
                            "batch_size": len(batch),
                            "total_batches": (len(vectors) + batch_size - 1) // batch_size
                        }
                    }
                )
            
            logger.info(
                "Successfully upserted all chunks",
                extra={
                    "extra_fields": {
                        "total_vectors": len(vectors),
                        "index_name": self.index_name
                    }
                }
            )
            
            return True
            
        except Exception as e:
            logger.error(
                "Failed to upsert chunks",
                extra={
                    "extra_fields": {
                        "chunk_count": len(chunks),
                        "error": str(e)
                    }
                }
            )
            return False
    
    def search_by_week(self, query_text: Union[str, List[float]], week: int, top_k: int = 10, 
                      section: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Search for similar chunks filtered by week and optionally by section.
        
        Args:
            query_text: The query text (should be embedded before calling)
            week: Pregnancy week to filter by (1-40)
            top_k: Number of results to return
            section: Optional section filter
            
        Returns:
            List of dictionaries containing text and metadata
        """
        if not self._is_initialized:
            logger.error("RAGService not initialized. Call init_index() first.")
            return []
        
        try:
            logger.info(
                "Searching chunks by week",
                extra={
                    "extra_fields": {
                        "week": week,
                        "section": section,
                        "top_k": top_k,
                        "query_length": len(query_text)
                    }
                }
            )
            
            # Handle text input by embedding it
            if isinstance(query_text, str):
                # This would require embedding service integration
                logger.error("Text input not supported yet - please provide embedding vector")
                return []
            
            query_vector = query_text
            
            # Build filter
            filter_dict = {"week": week}
            if section:
                filter_dict["section"] = section
            
            # Perform search
            results = self._index.query(
                vector=query_vector,
                top_k=top_k,
                include_metadata=True,
                filter=filter_dict
            )
            
            # Extract and format results
            formatted_results = []
            for match in results.get('matches', []):
                result = {
                    'id': match['id'],
                    'score': match['score'],
                    'text': match['metadata'].get('text', ''),
                    'week': match['metadata'].get('week'),
                    'section': match['metadata'].get('section', ''),
                    'metadata': {k: v for k, v in match['metadata'].items() 
                               if k not in ['text', 'week', 'section']}
                }
                formatted_results.append(result)
            
            logger.info(
                "Search completed successfully",
                extra={
                    "extra_fields": {
                        "results_count": len(formatted_results),
                        "week": week,
                        "section": section
                    }
                }
            )
            
            return formatted_results
            
        except Exception as e:
            logger.error(
                "Failed to search chunks",
                extra={
                    "extra_fields": {
                        "week": week,
                        "section": section,
                        "error": str(e)
                    }
                }
            )
            return []
    
    def fetch_by_id(self, chunk_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch a specific chunk by its ID.
        
        Args:
            chunk_id: The unique chunk identifier
            
        Returns:
            Dictionary containing chunk data or None if not found
        """
        if not self._is_initialized:
            logger.error("RAGService not initialized. Call init_index() first.")
            return None
        
        try:
            logger.debug(
                "Fetching chunk by ID",
                extra={
                    "extra_fields": {
                        "chunk_id": chunk_id
                    }
                }
            )
            
            # Fetch the vector
            results = self._index.fetch(ids=[chunk_id])
            
            if chunk_id not in results.get('vectors', {}):
                logger.warning(f"Chunk not found: {chunk_id}")
                return None
            
            vector_data = results['vectors'][chunk_id]
            
            result = {
                'id': chunk_id,
                'values': vector_data.get('values', []),
                'text': vector_data['metadata'].get('text', ''),
                'week': vector_data['metadata'].get('week'),
                'section': vector_data['metadata'].get('section', ''),
                'metadata': {k: v for k, v in vector_data['metadata'].items() 
                           if k not in ['text', 'week', 'section']}
            }
            
            logger.debug(f"Successfully fetched chunk: {chunk_id}")
            return result
            
        except Exception as e:
            logger.error(
                "Failed to fetch chunk by ID",
                extra={
                    "extra_fields": {
                        "chunk_id": chunk_id,
                        "error": str(e)
                    }
                }
            )
            return None
    
    def delete_chunk(self, chunk_id: str) -> bool:
        """
        Delete a chunk from the index.
        
        Args:
            chunk_id: The unique chunk identifier
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self._is_initialized:
            logger.error("RAGService not initialized. Call init_index() first.")
            return False
        
        try:
            logger.info(
                "Deleting chunk from index",
                extra={
                    "extra_fields": {
                        "chunk_id": chunk_id
                    }
                }
            )
            
            # Delete the vector
            self._index.delete(ids=[chunk_id])
            
            logger.info(f"Successfully deleted chunk: {chunk_id}")
            return True
            
        except Exception as e:
            logger.error(
                "Failed to delete chunk",
                extra={
                    "extra_fields": {
                        "chunk_id": chunk_id,
                        "error": str(e)
                    }
                }
            )
            return False
    
    def get_index_stats(self) -> Optional[Dict[str, Any]]:
        """
        Get statistics about the current index.
        
        Returns:
            Dictionary containing index statistics or None if error
        """
        if not self._is_initialized:
            logger.error("RAGService not initialized. Call init_index() first.")
            return None
        
        try:
            stats = self._index.describe_index_stats()
            
            logger.debug(
                "Retrieved index stats",
                extra={
                    "extra_fields": {
                        "total_vector_count": stats.get('total_vector_count', 0),
                        "index_name": self.index_name
                    }
                }
            )
            
            return stats
            
        except Exception as e:
            logger.error(
                "Failed to get index stats",
                extra={
                    "extra_fields": {
                        "error": str(e)
                    }
                }
            )
            return None
    
    def is_ready(self) -> bool:
        """
        Check if the RAG service is ready for operations.
        
        Returns:
            bool: True if ready, False otherwise
        """
        return self._is_initialized and self._index is not None
