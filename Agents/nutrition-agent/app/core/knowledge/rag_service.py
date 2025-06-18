import logging
from typing import List, Dict, Any
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
    
    async def query(self, query: str, trimester: str = "all") -> NutritionQueryResult:
        """
        Perform a RAG query to get nutrition information
        
        Args:
            query: The user's nutrition query
            trimester: The pregnancy trimester (first, second, third, or all)
            
        Returns:
            NutritionQueryResult with answer and sources
        """
        if not self.initialized:
            await self.initialize()
            
        try:
            # Enhance the query with context
            enhanced_query = f"Pregnancy nutrition query for {trimester} trimester: {query}"
            
            # Retrieve relevant documents
            retrieved_docs = await vector_store_service.similarity_search(
                enhanced_query, 
                k=3
            )
            
            # Try to get additional documents specific to the trimester
            if trimester != "all":
                trimester_docs = await document_store.get_documents_by_trimester(trimester)
                
                # Extract text from these documents
                for doc in trimester_docs[:2]:  # Limit to 2 additional docs
                    if any(d.page_content == doc.text for d in retrieved_docs):
                        continue  # Skip if already in results
                    # Convert to LangChain document format
                    from langchain_core.documents import Document as LCDocument
                    lc_doc = LCDocument(page_content=doc.text, metadata=doc.metadata or {})
                    retrieved_docs.append(lc_doc)
            
            # If the query mentions a meal type, add relevant documents
            meal_types = ["breakfast", "lunch", "dinner", "snack", "dessert"]
            for meal_type in meal_types:
                if meal_type in query.lower():
                    meal_docs = await document_store.get_documents_by_meal_type(meal_type)
                    
                    # Extract text from these documents
                    for doc in meal_docs[:1]:  # Limit to 1 additional doc
                        if any(d.page_content == doc.text for d in retrieved_docs):
                            continue  # Skip if already in results
                        # Convert to LangChain document format
                        from langchain_core.documents import Document as LCDocument
                        lc_doc = LCDocument(page_content=doc.text, metadata=doc.metadata or {})
                        retrieved_docs.append(lc_doc)
            
            # Extract the text from retrieved documents
            contexts = [doc.page_content for doc in retrieved_docs]
            sources = [doc.page_content[:100] + "..." for doc in retrieved_docs]
            
            # Build the prompt with context
            prompt = self._build_rag_prompt(query, contexts, trimester)
            
            # Generate the answer using the LLM
            answer = await llm_service.generate_text(prompt)
            
            result = NutritionQueryResult(
                answer=answer,
                sources=sources,
                confidence=0.85  # Placeholder confidence score
            )
            
            logger.info(f"Generated RAG response for query: {query}")
            return result
        except Exception as e:
            logger.error(f"Error performing RAG query: {str(e)}")
            raise
    
    def _build_rag_prompt(self, query: str, contexts: List[str], trimester: str) -> str:
        """Build a prompt for RAG query with retrieved contexts"""
        context_text = "\n\n".join([f"Context {i+1}: {ctx}" for i, ctx in enumerate(contexts)])
        
        prompt = f"""You are a pregnancy nutrition expert providing advice based on the following context information.
        
CONTEXT INFORMATION:
{context_text}

QUERY: {query}

PREGNANCY STAGE: {trimester} trimester

Provide a helpful, accurate, and concise response to the query based only on the provided context information.
Focus on nutritional guidance that is appropriate for the specified pregnancy stage.
If the context doesn't contain relevant information to answer the query, acknowledge this limitation.

RESPONSE:
"""
        return prompt

# Create singleton instance
rag_service = RAGService()