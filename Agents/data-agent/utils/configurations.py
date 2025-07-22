from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    MONGO_URI = os.getenv("MONGO_URI")
    API_KEY = os.getenv("API_KEY")
    AGENT_KEYS = {
        "nutritionist": os.getenv("API_KEY_NUTRITIONIST"),
        "mental_health": os.getenv("API_KEY_MENTAL_HEALTH"),
        "kickcount": os.getenv("API_KEY_KICKCOUNT"),
        "useronboarding": os.getenv("API_KEY_USER_ONBOARDING")
    }

config = Config()