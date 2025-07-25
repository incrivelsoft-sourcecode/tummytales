import os
import uuid
from datetime import datetime, timezone
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from utils.configurations import config
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
uri = config.MONGO_URI
client = MongoClient(uri, server_api=ServerApi('1'))

# Database and shared-collections
db = client["tummytales"]
users = db["users"]
activity_logs = db["activity_logs"]
sessions = db["sessions"]
feedback_messages = db["feedback_messages"]
media_references = db["media_references"]