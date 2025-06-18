# scripts/test_mongodb.py
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

async def test_mongodb():
    load_dotenv()
    
    # Use your MongoDB Atlas connection string
    # It should look something like: mongodb+srv://username:password@cluster.mongodb.net/myFirstDatabase
    mongodb_url = os.getenv("MONGODB_URL", "mongodb+srv://your-username:your-password@your-cluster.mongodb.net/tummytales_nutrition")
    
    print(f"Connecting to MongoDB at {mongodb_url}")
    client = AsyncIOMotorClient(mongodb_url, serverSelectionTimeoutMS=5000)
    
    try:
        # Check connection
        await client.server_info()
        print("Connected successfully")
        
        # Get database
        db = client["tummytales_nutrition"]
        
        # Insert a test document
        test_doc = {
            "test_id": "test123",
            "content": "This is a test document"
        }
        
        result = await db.test_collection.insert_one(test_doc)
        print(f"Inserted document with ID: {result.inserted_id}")
        
        # Retrieve the document
        retrieved = await db.test_collection.find_one({"test_id": "test123"})
        print(f"Retrieved document: {retrieved}")
        
        # Clean up
        await db.test_collection.delete_one({"test_id": "test123"})
        print("Test document deleted")
    
    except Exception as e:
        print(f"MongoDB error: {str(e)}")
    finally:
        client.close()
        print("Connection closed")

if __name__ == "__main__":
    asyncio.run(test_mongodb())