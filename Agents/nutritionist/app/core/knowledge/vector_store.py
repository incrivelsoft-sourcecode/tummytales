import logging
from typing import List, Dict, Any, Optional
from langchain_pinecone import PineconeVectorStore
from langchain_core.documents import Document as LangchainDocument

from app.core.knowledge.document_store import Document, document_store
from app.core.knowledge.embeddings import embedding_service
from app.services.pinecone import pinecone_service

logger = logging.getLogger(__name__)

class VectorStoreService:
    """Service for managing vector storage and retrieval"""
    
    def __init__(self):
        self.vector_store = None
        self.initialized = False
    
    async def initialize(self):
        """Initialize the vector store with Pinecone"""
        if self.initialized:
            return True
            
        try:
            # Make sure dependent services are initialized
            await embedding_service.initialize()
            pinecone_service.initialize()
            
            # Get the Pinecone index
            pinecone_index = pinecone_service.get_index()
            
            # Create the vector store
            self.vector_store = PineconeVectorStore(
                index=pinecone_index,
                embedding=embedding_service.embeddings,
                text_key="text"
            )
            
            logger.info("Vector store initialized successfully")
            self.initialized = True
            return True
        except Exception as e:
            logger.error(f"Error initializing vector store: {str(e)}")
            raise
    
    async def add_documents(self, documents: List[Document]):
        """Add documents to the vector store"""
        if not self.initialized:
            await self.initialize()
            
        try:
            # Convert our Document objects to LangChain Document objects
            langchain_docs = []
            for doc in documents:
                lc_doc = LangchainDocument(
                    page_content=doc.text,
                    metadata=doc.metadata or {}
                )
                langchain_docs.append(lc_doc)
            
            # Add documents to the vector store
            self.vector_store.add_documents(langchain_docs)
            logger.info(f"Added {len(documents)} documents to vector store")
            return True
        except Exception as e:
            logger.error(f"Error adding documents to vector store: {str(e)}")
            raise
    
    async def similarity_search(self, query: str, k: int = 4) -> List[LangchainDocument]:
        """Search for similar documents in the vector store"""
        if not self.initialized:
            await self.initialize()
            
        try:
            results = self.vector_store.similarity_search(query, k=k)
            logger.info(f"Found {len(results)} similar documents for query")
            return results
        except Exception as e:
            logger.error(f"Error searching vector store: {str(e)}")
            raise
    
    async def load_initial_data(self):
        """Load initial documents from document store into vector store"""
        try:
            # Make sure document store is initialized
            await document_store.initialize()
            
            # Get all documents
            docs = document_store.get_all_documents()
            
            if docs:
                # Add documents to vector store
                await self.add_documents(docs)
                logger.info(f"Loaded {len(docs)} documents into vector store")
            else:
                logger.warning("No documents found in document store to load into vector store")
                
            return True
        except Exception as e:
            logger.error(f"Error loading initial data into vector store: {str(e)}")
            raise

# Create singleton instance
vector_store_service = VectorStoreService()