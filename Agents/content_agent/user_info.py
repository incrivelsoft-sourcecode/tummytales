from pymongo import MongoClient
from fastapi import HTTPException
import os  # Ensure os is imported for environment variables

# Class for interacting with user info
class UserDatabase:
    def __init__(self, user_id: str):
        self.uid = user_id
        client = MongoClient(os.getenv("MONGODB_URL"))
        db = client.get_database(os.getenv("MONGODB_DB_NAME"))
        self.profiles = db.get_collection("profiles")  # Define as an instance variable

    async def find_user(self):
        # Use self.profiles and self.uid
        profile = await self.profiles.find_one({"userId": self.uid})
        if not profile:
            raise HTTPException(status_code=404, detail="No profile found for this user.")
        return profile  # Return the profile

    async def get_user_saved_news(self):
        # Fetch the user profile and return saved news
        profile = await self.find_user()
        return profile.get("saved_news", {})  # Use .get() to avoid KeyError

    async def get_user_country(self):
        profile = await self.find_user()
        return profile.get("generalDetails", {}).get("country", "Unknown")

    async def get_user_state(self):
        profile = await self.find_user()
        return profile.get("generalDetails", {}).get("state", "Unknown")

    async def get_user_city(self):
        profile = await self.find_user()
        return profile.get("generalDetails", {}).get("city", "Unknown")