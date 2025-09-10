"""
Integration example demonstrating how RAGService and similarity_service work together.
This example shows the typical workflow for content generation with duplicate detection.
"""

import sys
import time
from typing import List, Dict, Any
from services.rag_service import RAGService
from services.similarity_service import is_duplicate, add_to_index
from services.embeddings import EmbeddingService
from models.similarity_index import CONTENT_TYPES
from config.logger import get_logger

logger = get_logger(__name__)


class MockPineconeForDemo:
    """Mock Pinecone client for demonstration purposes."""
    
    def __init__(self):
        self.vectors = {}
        self.indexes = {'demo-index': {'vectors': {}}}
    
    def list_indexes(self):
        return [type('Index', (), {'name': name})() for name in self.indexes.keys()]
    
    def create_index(self, name: str, **kwargs):
        self.indexes[name] = {'vectors': {}, 'config': kwargs}
    
    def Index(self, name: str):
        mock_index = type('MockIndex', (), {})()
        mock_index.upsert = lambda vectors: self._upsert(name, vectors)
        mock_index.query = lambda vector, top_k=10, filter=None, include_metadata=True: self._query(name, vector, top_k, filter)
        mock_index.fetch = lambda ids: self._fetch(name, ids)
        mock_index.delete = lambda ids: self._delete(name, ids)
        mock_index.describe_index_stats = lambda: {'total_vector_count': len(self.indexes[name]['vectors'])}
        return mock_index
    
    def _upsert(self, index_name, vectors):
        for vector in vectors:
            self.indexes[index_name]['vectors'][vector['id']] = vector
    
    def _query(self, index_name, query_vector, top_k, filter_dict):
        # Simple similarity search simulation
        matches = []
        for vid, vector_data in self.indexes[index_name]['vectors'].items():
            # Check filter
            if filter_dict:
                metadata = vector_data.get('metadata', {})
                filter_match = all(metadata.get(k) == v for k, v in filter_dict.items())
                if not filter_match:
                    continue
            
            # Simple dot product as similarity score
            score = sum(a * b for a, b in zip(query_vector[:3], vector_data['values'][:3]))
            matches.append({
                'id': vid,
                'score': abs(score),
                'metadata': vector_data.get('metadata', {})
            })
        
        # Sort by score and return top_k
        matches.sort(key=lambda x: x['score'], reverse=True)
        return {'matches': matches[:top_k]}
    
    def _fetch(self, index_name, ids):
        vectors = {}
        for vid in ids:
            if vid in self.indexes[index_name]['vectors']:
                vectors[vid] = self.indexes[index_name]['vectors'][vid]
        return {'vectors': vectors}
    
    def _delete(self, index_name, ids):
        for vid in ids:
            self.indexes[index_name]['vectors'].pop(vid, None)


def demo_rag_and_similarity_workflow():
    """
    Demonstrate the complete workflow of:
    1. Setting up RAG service
    2. Embedding content
    3. Checking for duplicates
    4. Storing in RAG and similarity index
    5. Searching for similar content
    """
    
    print("🚀 Starting RAG and Similarity Service Demo")
    print("=" * 50)
    
    # Step 1: Initialize services with mock clients
    print("\n1. Initializing services...")
    
    # Create mock Pinecone client
    mock_pinecone = MockPineconeForDemo()
    
    # Initialize RAG service
    rag_service = RAGService(
        api_key="demo_key",
        env="demo_env", 
        index_name="demo-index",
        pinecone_client=mock_pinecone
    )
    
    # Initialize RAG index
    rag_ready = rag_service.init_index()
    print(f"   ✓ RAG Service ready: {rag_ready}")
    
    # Step 2: Prepare sample content for week 12 pregnancy
    print("\n2. Preparing sample content...")
    
    sample_chunks = [
        {
            'id': 'nutrition_week12_001',
            'text': 'During week 12 of pregnancy, focus on getting enough folate from leafy greens and fortified cereals.',
            'week': 12,
            'section': 'nutrition',
            'embedding_vector': [0.8, 0.1, 0.2] + [0.1] * 381  # Mock embedding
        },
        {
            'id': 'exercise_week12_001', 
            'text': 'Light walking and prenatal yoga are excellent exercises for week 12 of pregnancy.',
            'week': 12,
            'section': 'exercise',
            'embedding_vector': [0.2, 0.8, 0.1] + [0.1] * 381  # Mock embedding
        },
        {
            'id': 'symptoms_week12_001',
            'text': 'By week 12, morning sickness may start to decrease for many pregnant women.',
            'week': 12, 
            'section': 'symptoms',
            'embedding_vector': [0.1, 0.2, 0.8] + [0.1] * 381  # Mock embedding
        }
    ]
    
    print(f"   ✓ Prepared {len(sample_chunks)} sample chunks for week 12")
    
    # Step 3: Store content in RAG service
    print("\n3. Storing content in RAG service...")
    
    success = rag_service.upsert_chunks(sample_chunks)
    print(f"   ✓ Content stored successfully: {success}")
    
    # Step 4: Add vectors to similarity index (for duplicate detection)
    print("\n4. Adding vectors to similarity index...")
    
    for chunk in sample_chunks:
        # In real usage, this would be called during content generation
        # to prevent duplicates for a specific user
        success = add_to_index(
            user_id="demo_user_123",
            week=chunk['week'],
            content_type=CONTENT_TYPES['QUIZ'],  # Assume this is for quiz generation
            vector=chunk['embedding_vector'],
            text_hash=f"hash_{chunk['id']}"
        )
        print(f"   ✓ Added {chunk['id']} to similarity index: {success}")
    
    # Step 5: Demonstrate search functionality
    print("\n5. Demonstrating search functionality...")
    
    # Search for nutrition-related content in week 12
    search_vector = [0.7, 0.1, 0.3] + [0.1] * 381  # Mock query embedding
    search_results = rag_service.search_by_week(
        query_text=search_vector,
        week=12,
        section='nutrition',
        top_k=3
    )
    
    print(f"   ✓ Found {len(search_results)} nutrition-related results:")
    for result in search_results:
        print(f"      - {result['id']}: {result['text'][:50]}... (score: {result['score']:.3f})")
    
    # Step 6: Demonstrate duplicate detection
    print("\n6. Demonstrating duplicate detection...")
    
    # Test with a very similar vector (should be detected as duplicate)
    similar_vector = [0.81, 0.11, 0.21] + [0.1] * 381  # Very similar to first chunk
    is_dup = is_duplicate(
        candidate_vector=similar_vector,
        user_id="demo_user_123", 
        week=12,
        content_type=CONTENT_TYPES['QUIZ'],
        threshold=0.6
    )
    print(f"   ✓ Similar vector detected as duplicate: {is_dup}")
    
    # Test with a different vector (should not be duplicate)
    different_vector = [0.1, 0.1, 0.1] + [0.9] * 381  # Very different
    is_dup = is_duplicate(
        candidate_vector=different_vector,
        user_id="demo_user_123",
        week=12, 
        content_type=CONTENT_TYPES['QUIZ'],
        threshold=0.6
    )
    print(f"   ✓ Different vector detected as duplicate: {is_dup}")
    
    # Step 7: Demonstrate content retrieval by ID
    print("\n7. Demonstrating content retrieval...")
    
    chunk_data = rag_service.fetch_by_id('nutrition_week12_001')
    if chunk_data:
        print(f"   ✓ Retrieved chunk: {chunk_data['text'][:50]}...")
    else:
        print("   ✗ Failed to retrieve chunk")
    
    # Step 8: Show index statistics
    print("\n8. Index statistics...")
    
    stats = rag_service.get_index_stats()
    if stats:
        print(f"   ✓ Total vectors in index: {stats.get('total_vector_count', 0)}")
    
    print("\n🎉 Demo completed successfully!")
    print("=" * 50)
    
    return {
        'rag_service': rag_service,
        'sample_chunks': sample_chunks,
        'search_results': search_results
    }


if __name__ == "__main__":
    # Run the demo
    try:
        demo_results = demo_rag_and_similarity_workflow()
        print("\n📋 Demo Results Summary:")
        print(f"   - RAG Service initialized: {demo_results['rag_service'].is_ready()}")
        print(f"   - Sample chunks processed: {len(demo_results['sample_chunks'])}")
        print(f"   - Search results found: {len(demo_results['search_results'])}")
        
    except Exception as e:
        logger.error(f"Demo failed: {e}")
        print(f"❌ Demo failed: {e}")
        sys.exit(1)
