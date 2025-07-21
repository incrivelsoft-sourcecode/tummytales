# main.py
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging
from datetime import datetime


# Configure logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Import database
from app.config.database import db

# Import routes
from app.api.routes import router
from app.core.knowledge.loader import knowledge_loader

# Create FastAPI app
app = FastAPI(
    title="Nutrition Agent API",
    description="RAG-based nutritional guidance for pregnant women",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",        # Local development
        "http://localhost:8080",
        "https://tummytales.info",      # Production domain
        "https://www.tummytales.info",  # Production www variant
        "https://tummy-tales-bloom.vercel.app"  # Add your frontend deployment URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api")

# FIXED: Health endpoint under /api prefix
@app.get("/api/health")
def health_check():
    """API health check endpoint"""
    return {
        "status": "healthy",
        "service": "nutritionist-lite",
        "timestamp": datetime.utcnow().isoformat(),
        "message": "TummyTales Nutrition Agent is running"
    }

@app.on_event("startup")
async def startup_db_client():
    """Initialize database connection and load knowledge on startup"""
    try:
        mongo_uri = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        db_name = os.getenv("MONGODB_DB_NAME", "tummytales")
        logger.info(f"Connecting to MongoDB at {mongo_uri}")
        await db.connect_to_database(mongo_uri, db_name)
        logger.info("Successfully connected to MongoDB.")
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")

    # Initialize knowledge base
    try:
        # Placeholder for knowledge base loading if needed later
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
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "6001")), reload=True)