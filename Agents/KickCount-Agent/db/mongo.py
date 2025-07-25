from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = "Tummytales-Dev"

client = AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DB_NAME]

# Define your collection references
profile_col = db["profiles"]
entries_col = db["entries"]
feedback_col = db["feedback"]
memory_col = db["memory"]