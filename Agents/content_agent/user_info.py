
import requests
import os

API_URL = "https://tummytales-db-api.onrender.com"
# You need to set these environment variables
API_KEY = os.getenv("X_API_KEY")
AGENT_KEY = os.getenv("X_AGENT_KEY")

def get_user_profile(user_id: str):
    """
    Fetches a user's profile from the API.
    """
    headers = {
        "accept": "application/json",
        "X-API-Key": API_KEY,
        "X-Agent-Key": AGENT_KEY
    }
    response = requests.get(f"{API_URL}/useronboarding/mom?user_id={user_id}", headers=headers)
    response.raise_for_status()
    return response.json()

def get_user_country(user_id: str):
    """
    Gets a user's country from their profile.
    """
    profile = get_user_profile(user_id)
    return profile.get("generalDetails", {}).get("country", "Unknown")

def get_user_state(user_id: str):
    """
    Gets a user's state from their profile.
    """
    profile = get_user_profile(user_id)
    return profile.get("generalDetails", {}).get("State", "Unknown")

def get_user_city(user_id: str):
    """
    Gets a user's city from their profile.
    """
    profile = get_user_profile(user_id)
    return profile.get("generalDetails", {}).get("city", "Unknown")

def get_user_saved_news(user_id: str):
    """
    Gets a user's saved news.
    NOTE: This functionality is not yet implemented in the API.
    """
    # Returning an empty list as a placeholder
    return []

def save_user_article(user_id: str, article: dict):
    """
    Saves an article for a user.
    Need to send a get request using the render API
    NOTE: This functionality is not yet implemented in the API.
    """
    # Placeholder function
    print(f"Article saving not implemented. User: {user_id}, Article: {article}")
    pass
