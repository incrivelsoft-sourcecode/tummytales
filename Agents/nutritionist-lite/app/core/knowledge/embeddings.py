import logging
import os
from typing import List, Dict, Any
import openai
from openai import OpenAI
from app.core.knowledge.document_store import Document, document_store

logger = logging.getLogger(__name__)

class EmbeddingService:
    """Service for generating embeddings using OpenAI API (LangChain compatible)"""
    
    def __init__(self):
        self.client = None
        self.model = "text-embedding-3-small"
        self.initialized = False
    
    async def initialize(self):
        """Initialize the OpenAI client"""
        try:
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable not set")
            
            self.client = OpenAI(api_key=api_key)
            self.initialized = True
            logger.info(f"Embedding service initialized with OpenAI model: {self.model}")
        except Exception as e:
            logger.error(f"Failed to initialize embedding service: {e}")
            raise
    
    async def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed multiple documents using OpenAI API"""
        if not self.initialized:
            await self.initialize()
        
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=texts
            )
            return [embedding.embedding for embedding in response.data]
        except Exception as e:
            logger.error(f"Failed to embed documents: {e}")
            raise
    
    async def embed_query(self, text: str) -> List[float]:
        """Embed a single query using OpenAI API"""
        if not self.initialized:
            await self.initialize()
        
        try:
            response = self.client.embeddings.create(
                model=self.model,
                input=[text]
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Failed to embed query: {e}")
            raise
    
    # LangChain compatibility methods
    async def aembed_documents(self, texts: List[str]) -> List[List[float]]:
        """Async embed documents (LangChain compatibility)"""
        return await self.embed_documents(texts)
    
    async def aembed_query(self, text: str) -> List[float]:
        """Async embed query (LangChain compatibility)"""
        return await self.embed_query(text)
    
    async def get_embedding_dimension(self) -> int:
        """Return the dimension of embeddings produced by this model"""
        return 1536

# Create singleton instance
embedding_service = EmbeddingService()
