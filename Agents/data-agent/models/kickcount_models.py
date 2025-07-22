from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# ----------------------------
# Movement Entry Model
# ----------------------------
class MovementModel(BaseModel):
    user_id: str
    session_id: str
    timestamp: datetime
    strength: Optional[str]
    duration: Optional[int]
    notes: Optional[str]

# ----------------------------
# Feedback Summary Model
# ----------------------------
class FeedbackModel(BaseModel):
    user_id: str
    session_id: Optional[str]
    feedback_text: str
    score: Optional[float]
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ----------------------------
# Feedback Log Entry Model
# ----------------------------
class FeedbackLogModel(BaseModel):
    user_id: str
    session_id: Optional[str]
    feedback_text: str
    generated_by: str  # e.g. 'kick_agent'
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ----------------------------
# Legacy UI Entry (if needed)
# ----------------------------
class EntryModel(BaseModel):
    user_id: str
    session_id: str
    timestamp: datetime
    notes: Optional[str]