from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


# -----------------------------
# Questions Collection
# -----------------------------
class AnswerOptionModel(BaseModel):
    text: str
    score: int

class QuestionModel(BaseModel):
    serialNumber: int
    question: str
    answers: List[AnswerOptionModel]


# # -------code-review-----------
# # Questions Collection
# # -----------------------------
# class AnswerOptionModel(BaseModel):
#     text: str
#     score: int

# class QuestionModel(BaseModel):
#     serialNumber: int
#     question: str
#     answers: List[AnswerOptionModel]

# -----------------------------
# Scores Collection
# -----------------------------

class ScoreInfoModel(BaseModel):
    questionId: int
    score: int

class AnswerEntryModel(BaseModel):
    questionId: int
    answerIndex: int

class ScoreDocumentModel(BaseModel):
    user: str
    totalScore: int
    scoreInfo: List[ScoreInfoModel]
    answers: List[AnswerEntryModel]
    message: str
    followUp: Optional[List[int]] = None
    createdAt: datetime


# -----------------------------
# Chats Collection
# -----------------------------
class ChatMessageModel(BaseModel):
    role: str  # 'user' or 'agent'
    text: str
    time: datetime

class ChatSessionModel(BaseModel):
    sessionId: str
    messages: List[ChatMessageModel]
