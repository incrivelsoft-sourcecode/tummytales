# main.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging  # Add this import

# Configure logger
logger = logging.getLogger(__name__)  # Add this line

# Load environment variables
load_dotenv()

# Import database
from app.config.database import db

# Import routes
from app.api.routes import router
from app.core.knowledge.loader import knowledge_loader  # Add this import

# Create FastAPI app
app = FastAPI(
    title="Nutrition Agent API",
    description="RAG-based nutritional guidance for pregnant women",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")

@app.on_event("startup")
async def startup_db_client():
    """Initialize database connection and load knowledge on startup"""
    # Initialize database
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("MONGODB_DB_NAME", "tummytales")
    await db.connect_to_database(mongodb_url, db_name)
    
    # Initialize knowledge base
    try:
        # This will be handled by the RAG service when needed
        pass
    except Exception as e:
        logger.error(f"Error loading knowledge base: {str(e)}")

@app.on_event("shutdown")
async def shutdown_db_client():
    """Close database connection on shutdown"""
    await db.close_database_connection()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Nutrition Agent API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "5001")), reload=True)