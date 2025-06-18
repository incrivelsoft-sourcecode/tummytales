from typing import List, Dict, Any, Optional
import os
import json
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class Document(BaseModel):
    """Document model for storing text and metadata"""
    text: str
    metadata: Optional[Dict[str, Any]] = None

class DocumentStore:
    """Store for managing nutrition knowledge documents"""
    
    def __init__(self):
        self.documents: List[Document] = []
        self.initialized = False
        
    async def initialize(self):
        """Load initial documents from files"""
        if self.initialized:
            return
            
        # In the new architecture, we'll use the knowledge loader
        # instead of loading documents directly here
        logger.info("Document store initialized")
        self.initialized = True
        return True
    
    async def get_all_documents(self) -> List[Document]:
        """Get all documents in the store"""
        return self.documents
    
    async def add_document(self, document: Document):
        """Add a document to the store"""
        self.documents.append(document)
        return True
    
    async def add_documents(self, documents: List[Document]):
        """Add multiple documents to the store"""
        self.documents.extend(documents)
        logger.info(f"Added {len(documents)} documents to store. Total documents: {len(self.documents)}")
        return True
    
    async def clear(self):
        """Clear all documents from the store"""
        self.documents = []
        logger.info("Document store cleared")
        return True
    
    async def get_documents_by_trimester(self, trimester: str) -> List[Document]:
        """Get documents specific to a trimester"""
        result = []
        
        for doc in self.documents:
            if doc.metadata and doc.metadata.get('trimester') == trimester:
                result.append(doc)
                
        return result
    
    async def get_documents_by_meal_type(self, meal_type: str) -> List[Document]:
        """Get documents specific to a meal type"""
        result = []
        
        for doc in self.documents:
            if doc.metadata and doc.metadata.get('meal_type') == meal_type:
                result.append(doc)
                
        return result
    
    async def search_documents(self, query: str) -> List[Document]:
        """Simple keyword search through documents"""
        query = query.lower()
        result = []
        
        for doc in self.documents:
            if query in doc.text.lower():
                result.append(doc)
                
        return result

# Create singleton instance
document_store = DocumentStore()