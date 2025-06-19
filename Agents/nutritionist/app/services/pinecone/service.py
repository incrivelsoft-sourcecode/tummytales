from pinecone import Pinecone
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PineconeService:
    """Service for interacting with Pinecone vector database"""
    
    def __init__(self):
        self.api_key = os.getenv('PINECONE_API_KEY')
        self.environment = os.getenv('PINECONE_ENVIRONMENT')
        self.index_name = os.getenv('PINECONE_INDEX_NAME')
        
        if not self.api_key:
            raise ValueError('PINECONE_API_KEY environment variable is not set')
        if not self.environment:
            raise ValueError('PINECONE_ENVIRONMENT environment variable is not set')
        if not self.index_name:
            raise ValueError('PINECONE_INDEX_NAME environment variable is not set')
            
        self.client = None
        self.index = None
    
    def initialize(self):
        """Initialize the Pinecone client and connect to the index"""
        try:
            logger.info(f'Initializing Pinecone with environment: {self.environment}')
            self.client = Pinecone(api_key=self.api_key)
            
            # Check if index exists
            indexes = self.client.list_indexes()
            index_exists = False
            
            for index_info in indexes:
                if index_info.name == self.index_name:
                    index_exists = True
                    break
            
            if not index_exists:
                logger.warning(f'Index {self.index_name} does not exist. Please create it first.')
                return False
            
            # Connect to existing index
            self.index = self.client.Index(self.index_name)
            logger.info(f'Successfully connected to index: {self.index_name}')
            return True
            
        except Exception as e:
            logger.error(f'Error initializing Pinecone: {str(e)}')
            raise
    
    def get_index(self):
        """Get the Pinecone index"""
        if not self.index:
            raise ValueError('Pinecone service not initialized. Call initialize() first.')
        return self.index
    
    def is_connected(self):
        """Check if connected to Pinecone"""
        return self.index is not None

# Create singleton instance
pinecone_service = PineconeService()