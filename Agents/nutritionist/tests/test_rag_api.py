import asyncio
import os
import sys
import unittest
from httpx import AsyncClient
import pytest

# Add the project root to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

class TestNutritionRagAPI(unittest.TestCase):
    """Test cases for the RAG-based nutrition API"""
    
    @pytest.mark.asyncio
    async def test_health_endpoint(self):
        """Test the health check endpoint"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get("/api/nutrition/health")
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "ok"
    
    @pytest.mark.asyncio
    async def test_query_endpoint(self):
        """Test the nutrition query endpoint"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            query_data = {
                "query": "What foods are good for iron during pregnancy?",
                "trimester": "second"
            }
            response = await client.post("/api/nutrition/query", json=query_data)
            assert response.status_code == 200
            data = response.json()
            assert "answer" in data
            assert len(data["sources"]) > 0
    
    @pytest.mark.asyncio
    async def test_invalid_query(self):
        """Test behavior with an empty query"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            query_data = {
                "query": "",
                "trimester": "first"
            }
            response = await client.post("/api/nutrition/query", json=query_data)
            assert response.status_code != 200

# Create a simpler test script that can be run directly
async def run_simple_test():
    """Run a simple manual test of the API"""
    print("Testing Nutrition RAG API...")
    
    async with AsyncClient(app=app, base_url="http://localhost:5001") as client:
        # Test health endpoint
        print("\nTesting health endpoint...")
        response = await client.get("/api/nutrition/health")
        print(f"Status code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        # Test query endpoint
        print("\nTesting nutrition query endpoint...")
        query_data = {
            "query": "What foods are high in iron for pregnancy?",
            "trimester": "second"
        }
        response = await client.post("/api/nutrition/query", json=query_data)
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\nQuery result:")
            print(f"Answer: {data['answer']}")
            print("\nSources:")
            for i, source in enumerate(data["sources"]):
                print(f"  {i+1}. {source}")
        else:
            print(f"Error: {response.text}")

if __name__ == "__main__":
    # When run directly, execute the simple test
    asyncio.run(run_simple_test())