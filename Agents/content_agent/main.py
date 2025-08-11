# filepath: content_agent/main.py
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Body, HTTPException  # Add HTTPException for error handling
from pymongo import MongoClient
import feedparser
import anthropic
from fastapi.middleware.cors import CORSMiddleware
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import Pinecone as LangChainPinecone
from langchain.prompts import PromptTemplate
from langchain_community.llms import Anthropic
from pydantic import BaseModel

#for user's saved articles
from user_info import UserDatabase  # Use absolute import

#embedding vector should be size 1024
load_dotenv()

class RSSRequest(BaseModel):
    url: str

class ContentAPI:
    client = MongoClient(os.getenv("MONGODB_URL"))
    db = client.get_database(os.getenv("MONGODB_DB_NAME"))

    #incorporate this into populating the News tab on the website
    rss_feeds = db.get_collection("rss_feeds")

    #for news aggregation
    news_stories = [] #temp storage; only favorited articles are saved between sessions
        
    #for online search/LLM
    claude = anthropic.Anthropic(api_key=os.getenv("CLAUDE_KEY"))

    def __init__(self, user_id: str):
        self.user_id = user_id
        self.user_saved_articles = None  # Initialize as None
        self.allowed_tools = [{
            "type": "web_search_20250305",
            "name": "web_search",
            "max_uses": 3,
            # Add more domains we trust later
            "allowed_domains": ["healthline.com", "nih.gov", "webmd.com", "mayoclinic.org", "health.harvard.edu"],
            "user_location": {
                "type": "approximate",
                "city": UserDatabase.get_user_city(user_id),
                "region": UserDatabase.get_user_state(user_id),
                "country": UserDatabase.get_user_country(user_id),
                "timezone": "America/Los_Angeles" # This is a placeholder, replace with fetching actual user info later
            }
        }]
        self.app = FastAPI()
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=[
                "http://localhost:8000",
                "https://tummytales.info",
                "https://www.tummytales.info"
            ],
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT"],
            allow_headers=["*"]
        )
        self.app.add_api_route("/", self.read_root, methods=["GET"])
        self.app.add_api_route("/rss-url/", self.parse_rss, methods=["POST"])
        self.app.add_api_route("/news-query/", self.get_relevant_news, methods=["POST"])
        self.app.add_api_route("/mark-saved/", self.mark_article_as_saved, methods=["PUT"])

    async def initialize(self):
        # Properly instantiate UserDatabase
        self.user_saved_articles = await UserDatabase(self.user_id).get_user_saved_news()

    def read_root(self):
        return {"Hello": "This is the Content Aggregation API!"}

    async def parse_rss(self, url: RSSRequest):
        rss_url = url.url  # Access the validated `url` field
        feed = feedparser.parse(rss_url)
        feed_info = feed['feed']
        await self.rss_feeds.insert_one({"URL": rss_url, "Title": feed_info["title"], "Feed": feed})
        news_stories = []
        for entry in feed.entries:
            desc = {"Title": entry.title, "Link": entry.link, "Date": "", "Summary": ""}
            if hasattr(entry, "published"):
                desc["Date"] = entry.published
            if hasattr(entry, "summary"):
                desc["Summary"] = entry.summary
            news_stories.append(desc)
        return {"news_stories": news_stories}

    async def get_relevant_news(self, query: str):
        #currently returns a typeerror
        try:
            # Call the Claude API with the query and allowed tools
            resp = self.claude.messages.create(
                model="claude-opus-4-20250514",
                max_tokens=1024,
                system="You must find 5 news articles related to this query online. Only return the article title, URL, thumbnail image, and a short summary.",
                messages=[
                    {
                        "role": "user",
                        "content": query
                    }
                ],
                tools=self.allowed_tools
            )

            # Ensure the response is JSON-serializable
            if isinstance(resp, dict):
                return {"response": resp}
            elif hasattr(resp, "to_dict"):
                return {"response": resp.to_dict()}
            else:
                return {"response": str(resp)}

        except Exception as e:
            # Handle any unexpected errors
            return {"error": f"Failed to process response: {str(e)}"}

    def _serialize_item(self, item):
        # Helper method to serialize individual items
        if isinstance(item, (dict, list, str, int, float, bool, type(None))):
            return item
        return str(item)  # Convert non-serializable items to strings

    async def mark_article_as_saved(self, desc: dict = Body(...)):
        try:
            # Validate that the input is a dictionary
            if not isinstance(desc, dict):
                raise HTTPException(status_code=400, detail="Invalid input format. Expected a JSON object.")

            # Log the incoming data for debugging
            print(f"Received data to save: {desc}")

            # Insert the article into the database
            await self.user_saved_articles.insert_one(desc)
            st = f"Article '{desc['Title']}' saved!"
            return {"response": st}

        except Exception as e:
            # Handle unexpected errors
            return {"error": f"Failed to save article: {str(e)}"}

# Initialize the ContentAPI instance
content_api = ContentAPI(user_id="sample_user_id")

# Perform async initialization
async def initialize_content_api():
    await content_api.initialize()

# Use FastAPI's startup event to initialize the ContentAPI instance
@content_api.app.on_event("startup")
async def startup_event():
    await initialize_content_api()

app = content_api.app