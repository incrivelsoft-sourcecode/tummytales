from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controller.askamma_controller import router as askamma_router
from dotenv import load_dotenv
import os

# Load .env variables
load_dotenv()

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(askamma_router, prefix="/api/amma")