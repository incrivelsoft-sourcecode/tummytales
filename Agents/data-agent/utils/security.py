from fastapi import Header, HTTPException, Depends
from dotenv import load_dotenv
from utils.configurations import config
import os

load_dotenv()

def verify_agent_api_key(agent: str):
    def dependency(x_api_key: str = Header(...)):
        expected_key = config.AGENT_KEYS[agent]
        if expected_key is None:
            raise HTTPException(status_code=500, detail=f"API key not configured for agent '{agent}'")
        if x_api_key != expected_key:
            raise HTTPException(status_code=401, detail="Invalid or missing API Key")
    return dependency

def verify_api_key(x_api_key: str = Header(...)):
    if x_api_key != config.API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API Key")