from pymongo import MongoClient
from fastapi import HTTPException

#Class for interacting with user info
class UserDatabase:
    def __init__():
        client = MongoClient(os.getenv("MONGODB_URL"))
        db = client.get_database(os.getenv("MONGODB_DB_NAME"))
        profiles = db.get_collection("profiles")

    async def find_user(user_id: str):
        profile = await profiles.find_one({"userId": user_id})
        if not profile:
            raise HTTPException(status_code=404, detail="No profile found for this user.")
    
    async def get_user_saved_news(user_id: str):
        #returns dictionary 
        return find_user(user_id)["saved_news"]
    
    async def get_user_country(user_id: str):
        return find_user(user_id)["generalDetails"]["country"]

    async def get_user_state(user_id: str):
        return find_user(user_id)["generalDetails"]["state"]

    async def get_user_city(user_id: str):
        return find_user(user_id)["generalDetails"]["city"]