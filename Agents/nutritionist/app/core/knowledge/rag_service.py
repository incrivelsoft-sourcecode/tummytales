import logging
import time
import asyncio
from typing import List, Dict, Any, Tuple, Optional
from pydantic import BaseModel

from app.core.knowledge.vector_store import vector_store_service
from app.core.knowledge.document_store import document_store
from app.core.knowledge.loader import knowledge_loader
from app.services.llm import llm_service

logger = logging.getLogger(__name__)

class NutritionQueryResult(BaseModel):
    """Model for nutrition query results"""
    answer: str
    sources: List[str] = []
    confidence: float = 0.0

class RAGService:
    """Service for performing RAG queries for nutrition information"""
    
    def __init__(self):
        self.initialized = False
        # SPEED OPTIMIZATION: Add caching
        self.cache: Dict[str, Tuple[NutritionQueryResult, float]] = {}
        self.cache_duration = 300  # 5 minutes cache
        self.max_cache_size = 50  # Prevent memory bloat
    
    async def initialize(self):
        """Initialize the RAG service"""
        if self.initialized:
            return True
            
        try:
            # Initialize the vector store service
            await vector_store_service.initialize()
            
            # Initialize the document store
            await document_store.initialize()
            
            # Load knowledge data
            await knowledge_loader.load_all()
            
            # Load documents into vector store
            await self._load_documents_to_vector_store()
            
            logger.info("RAG service initialized successfully")
            self.initialized = True
            return True
        except Exception as e:
            logger.error(f"Error initializing RAG service: {str(e)}")
            raise
    
    async def _load_documents_to_vector_store(self):
        """Load documents from document store into vector store"""
        try:
            # Get all documents from the document store
            docs = await document_store.get_all_documents()
            
            if docs:
                # Add documents to the vector store
                await vector_store_service.add_documents(docs)
                logger.info(f"Loaded {len(docs)} documents into vector store")
            else:
                logger.warning("No documents found in document store to load into vector store")
                
            return True
        except Exception as e:
            logger.error(f"Error loading documents into vector store: {str(e)}")
            raise
    
    def _create_cache_key(self, query: str, trimester: str) -> str:
        """Create a standardized cache key"""
        # Normalize the query for better cache hits
        normalized_query = query.lower().strip()
        return f"{normalized_query}_{trimester}"
    
    def _clean_cache(self):
        """Clean expired entries from cache"""
        current_time = time.time()
        expired_keys = [
            key for key, (_, timestamp) in self.cache.items()
            if current_time - timestamp > self.cache_duration
        ]
        for key in expired_keys:
            del self.cache[key]
        
        # Also limit cache size
        if len(self.cache) > self.max_cache_size:
            # Remove oldest entries
            sorted_items = sorted(self.cache.items(), key=lambda x: x[1][1])
            items_to_remove = len(self.cache) - self.max_cache_size
            for key, _ in sorted_items[:items_to_remove]:
                del self.cache[key]
    
    async def query(self, query: str, trimester: str = "all") -> NutritionQueryResult:
        """
        Perform a RAG query to get nutrition information with caching
        
        Args:
            query: The user's nutrition query
            trimester: The pregnancy trimester (first, second, third, or all)
            
        Returns:
            NutritionQueryResult with answer and sources
        """
        if not self.initialized:
            await self.initialize()
        
        # SPEED OPTIMIZATION: Check cache first
        cache_key = self._create_cache_key(query, trimester)
        current_time = time.time()
        
        if cache_key in self.cache:
            cached_result, timestamp = self.cache[cache_key]
            if current_time - timestamp < self.cache_duration:
                logger.info("RAG cache hit - returning cached result")
                return cached_result
        
        # Clean expired cache entries periodically
        if len(self.cache) > 10:  # Only clean when cache has some entries
            self._clean_cache()
        
        try:
            # SPEED OPTIMIZATION: Simplify query processing
            start_time = time.time()
            
            # Enhance the query with context (simplified)
            enhanced_query = f"{query} {trimester} trimester"
            
            # SPEED OPTIMIZATION: Parallel document retrieval
            retrieval_tasks = []
            
            # Main similarity search
            retrieval_tasks.append(
                vector_store_service.similarity_search(enhanced_query, k=2)  # Reduced from 3 to 2
            )
            
            # Run all retrieval tasks in parallel
            results = await asyncio.gather(*retrieval_tasks, return_exceptions=True)
            
            # Process main similarity search results
            retrieved_docs = results[0] if not isinstance(results[0], Exception) else []
            
            # SPEED OPTIMIZATION: Simplified document enhancement (only if needed)
            if trimester != "all" and len(retrieved_docs) < 2:
                try:
                    trimester_docs = await document_store.get_documents_by_trimester(trimester)
                    
                    # Add only 1 additional document to keep response fast
                    for doc in trimester_docs[:1]:
                        if any(d.page_content == doc.text for d in retrieved_docs):
                            continue
                        from langchain_core.documents import Document as LCDocument
                        lc_doc = LCDocument(page_content=doc.text, metadata=doc.metadata or {})
                        retrieved_docs.append(lc_doc)
                        break  # Only add one
                except Exception as e:
                    logger.warning(f"Error retrieving trimester docs: {e}")
            
            # SPEED OPTIMIZATION: Simplified meal type enhancement
            meal_types = ["breakfast", "lunch", "dinner", "snack", "dessert"]
            query_lower = query.lower()
            
            for meal_type in meal_types:
                if meal_type in query_lower and len(retrieved_docs) < 3:
                    try:
                        meal_docs = await document_store.get_documents_by_meal_type(meal_type)
                        
                        for doc in meal_docs[:1]:  # Only 1 additional doc
                            if any(d.page_content == doc.text for d in retrieved_docs):
                                continue
                            from langchain_core.documents import Document as LCDocument
                            lc_doc = LCDocument(page_content=doc.text, metadata=doc.metadata or {})
                            retrieved_docs.append(lc_doc)
                            break  # Only add one
                        break  # Only process first matching meal type
                    except Exception as e:
                        logger.warning(f"Error retrieving meal docs: {e}")
            
            # Extract the text from retrieved documents
            contexts = [doc.page_content for doc in retrieved_docs]
            sources = [doc.page_content[:100] + "..." for doc in retrieved_docs]
            
            # Build the prompt with context
            prompt = self._build_rag_prompt(query, contexts, trimester)
            
            # SPEED OPTIMIZATION: Generate with optimized parameters
            answer = await llm_service.generate_text(
                prompt, 
                temperature=0.1,  # Lower temperature = faster generation
                max_tokens=1000   # Reduced from default for faster response
            )
            
            result = NutritionQueryResult(
                answer=answer,
                sources=sources,
                confidence=0.85
            )
            
            # Cache the result
            self.cache[cache_key] = (result, current_time)
            
            elapsed_time = time.time() - start_time
            logger.info(f"Generated RAG response for query: {query} (took {elapsed_time:.2f}s)")
            return result
            
        except Exception as e:
            logger.error(f"Error performing RAG query: {str(e)}")
            raise
    
    def _build_rag_prompt(self, query: str, contexts: List[str], trimester: str) -> str:
        """Build an optimized prompt for RAG query with retrieved contexts"""
        # SPEED OPTIMIZATION: Limit context length
        max_context_length = 1500  # Limit total context to keep prompt manageable
        
        context_text = ""
        current_length = 0
        
        for i, ctx in enumerate(contexts):
            if current_length + len(ctx) > max_context_length:
                # Truncate the context to fit
                remaining_space = max_context_length - current_length
                if remaining_space > 100:  # Only add if meaningful space left
                    context_text += f"Context {i+1}: {ctx[:remaining_space]}...\n\n"
                break
            else:
                context_text += f"Context {i+1}: {ctx}\n\n"
                current_length += len(ctx)
        
        prompt = f"""You are a pregnancy nutrition expert. Provide concise, accurate advice based on the context below.

CONTEXT:
{context_text}

QUERY: {query}
TRIMESTER: {trimester}

Provide a helpful, concise response (2-3 sentences) focusing on key nutritional guidance for {trimester} trimester. Be specific and actionable.

RESPONSE:
"""
        return prompt
    
    # SPEED OPTIMIZATION: Add method to clear cache if needed
    def clear_cache(self):
        """Clear the entire cache"""
        self.cache.clear()
        logger.info("RAG cache cleared")
    
    # SPEED OPTIMIZATION: Add method to get cache stats
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "cache_size": len(self.cache),
            "max_cache_size": self.max_cache_size,
            "cache_duration": self.cache_duration
        }

# Create singleton instance
rag_service = RAGService()