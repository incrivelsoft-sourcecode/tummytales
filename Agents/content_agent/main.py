# filepath: content_agent/main.py
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Body, HTTPException
from pymongo import MongoClient
import feedparser
import anthropic
from fastapi.middleware.cors import CORSMiddleware
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import Pinecone as LangChainPinecone
from langchain.prompts import PromptTemplate
from langchain_community.llms import Anthropic
from pydantic import BaseModel
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

#for user's saved articles
from content_agent.user_info import get_user_city, get_user_state, get_user_country, get_user_saved_news, save_user_article # Use absolute import

#embedding vector should be size 1024
load_dotenv()

class RSSRequest(BaseModel):
    url: str

class NewsQueryRequest(BaseModel):
    user_id: str
    query: str

class SaveArticleRequest(BaseModel):
    user_id: str
    desc: dict

app = FastAPI()

app.add_middleware(
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

#for news aggregation
news_stories = [] #temp storage; only favorited articles are saved between sessions
    
#for online search/LLM
claude = anthropic.Anthropic(api_key=os.getenv("CLAUDE_KEY"))

@app.get("/")
def read_root():
    return {"Hello": "This is the Content Aggregation API!"}

#has not been implemented in mom account api yet
@app.post("/rss-url/")
async def parse_rss(url: RSSRequest):
    rss_url = url.url
    feed = feedparser.parse(rss_url)
    feed_info = feed['feed']
    await rss_feeds.insert_one({"URL": rss_url, "Title": feed_info["title"], "Feed": feed})
    news_stories = []
    for entry in feed.entries:
        desc = {"Title": entry.title, "Link": entry.link, "Date": "", "Summary": ""}
        if hasattr(entry, "published"):
            desc["Date"] = entry.published
        if hasattr(entry, "summary"):
            desc["Summary"] = entry.summary
        news_stories.append(desc)
    return {"news_stories": news_stories}

@app.post("/news-query/")
async def get_relevant_news(request: NewsQueryRequest):
    allowed_tools = [{
        "type": "web_search_20250305",
        "name": "web_search",
        "max_uses": 3,
        # Add more domains we trust later
        "allowed_domains": ["healthline.com", "nih.gov", "webmd.com", "mayoclinic.org", "health.harvard.edu"],
        "user_location": {
            "type": "approximate",
            "city": get_user_city(request.user_id),
            "region": get_user_state(request.user_id),
            "country": get_user_country(request.user_id),
        }
    }]
    try:
        # Call the Claude API with the query and allowed tools
        resp = claude.messages.create(
            model="claude-opus-4-20250514",
            max_tokens=1024,
            system="You must find 5 news articles related to this query online. Only return the article title, URL, thumbnail image, and a short summary.",
            messages=[
                {
                    "role": "user",
                    "content": request.query
                }
            ],
            tools=allowed_tools
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

@app.put("/mark-saved/")
async def mark_article_as_saved(request: SaveArticleRequest):
    try:
        # Validate that the input is a dictionary
        if not isinstance(request.desc, dict):
            raise HTTPException(status_code=400, detail="Invalid input format. Expected a JSON object for 'desc'.")

        # Log the incoming data for debugging
        print(f"Received data to save for user {request.user_id}: {request.desc}")

        # Insert the article into the database
        save_user_article(request.user_id, request.desc)
        st = f"Article '{request.desc['Title']}' saved!"
        return {"response": st}

    except Exception as e:
        # Handle unexpected errors
        return {"error": f"Failed to save article: {str(e)}"}
