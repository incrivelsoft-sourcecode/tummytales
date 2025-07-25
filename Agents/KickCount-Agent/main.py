from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.mongo import entries_col, profile_col, memory_col
from dotenv import load_dotenv
from agents.superkick import SuperKickFeedbackAgent
from routes import kick, feedback, test
import os

# ───────────────────────────────
# Load environment
# ───────────────────────────────
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ───────────────────────────────
# FastAPI Setup
# ───────────────────────────────
app = FastAPI(
    title="TummyTales KickCount MCP",
    version="1.0",
    description="Robust Multi-Agent Control Pipeline for fetal kick tracking + feedback"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ───────────────────────────────
# Super Agent Setup
# ───────────────────────────────
superkick_agent = SuperKickFeedbackAgent()

# ───────────────────────────────
# Inject into app state for routes to reuse
# ───────────────────────────────
app.state.entries_col = entries_col
app.state.profile_col = profile_col
app.state.memory_col = memory_col
app.state.superkick_agent = superkick_agent

# ───────────────────────────────
# Register API Routers
# ───────────────────────────────
app.include_router(kick.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(test.router, prefix="/api")