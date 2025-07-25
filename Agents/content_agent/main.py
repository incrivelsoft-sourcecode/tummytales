# filepath: content_agent/main.py
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Body
from pymongo import MongoClient
import feedparser
import anthropic
from fastapi.middleware.cors import CORSMiddleware
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import Pinecone as LangChainPinecone
from langchain.prompts import PromptTemplate
from langchain_community.llms import Anthropic

#for user's saved articles
from user_info import UserDatabase

#embedding vector should be size 1024
load_dotenv()

class ContentAPI:
    client = MongoClient(os.getenv("MONGODB_URL"))
    db = client.get_database(os.getenv("MONGODB_DB_NAME"))

    #incorporate this into populating the News tab on the website
    rss_feeds = db.get_collection("rss_feeds")

    #for news aggregation
    news_stories = [] #temp storage; only favorited articles are saved between sessions
        
    #for online search/LLM
    claude = anthropic.Anthropic(api_key=os.getenv("CLAUDE_KEY"))
    allowed_tools = [{
    "type": "web_search_20250305",
    "name": "web_search",
    "max_uses": 3,
    #add more domains we trust later
    "allowed_domains": ["healthline.com", "nih.gov", "webmd.com", "mayoclinic.org", "health.harvard.edu"],
    #this is a placeholder, replace with fetching actual user info later
    "user_location": {
        "type": "approximate",
        "city": "San Francisco",
        "region": "California",
        "country": "US",
        "timezone": "America/Los_Angeles"
    }
    }]
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

    def __init__(self, user_id: str):
        self.user_saved_articles = UserDatabase.get_user_saved_news(user_id)

    #welcome message (test)
    @app.get("/")
    def read_root():
        return {"Hello": "This is the Content Aggregation API!"}

    #adds rss feed info to mongodb, returns news stories from url as a list
    @app.post("/rss-url/")
    async def parse_rss(url: dict = Body(...)):
        rss_url = url["rss_url"]
        feed = feedparser.parse(rss_url)
        feed_info = feed['feed']
        ContentAPI.rss_feeds.insert_one({"URL": rss_url, "Title": feed_info["title"], "Description": feed_info["description"], "Feed": feed})
        news_stories = []
        for entry in feed.entries:
            desc = {"Title": entry.title, "Link": entry.link, "Date": "", "Summary": ""}
            if hasattr(entry, "published"):
                desc["Date"] = entry.published
            if hasattr(entry, "summary"):
                desc["Summary"] = entry.summary
            news_stories.append(desc)
        return {"news_stories": news_stories}
            
    #searches internet based on query, returns relevant news
    # to do: parse llm response, add more trusted domains, error handling
    @app.post("/news-query/")
    async def get_relevant_news(query):
        resp = ContentAPI.claude.messages.create(
        model="claude-opus-4-20250514",
        max_tokens=1024,
        system="You must find 5 news articles related to this query online. Only return the article title, URL, thumbnail image, and a short summary.",
        messages=[
                {
                    "role": "user",
                    "content": query
                }
            ],
            tools=ContentAPI.allowed_tools
        )
        #to do: make sure this is correct syntax!
        for news in resp:
            news_stories.append(news)
        # currently returns the raw llm json response
        return{"response": resp}

    # given desc of article, allow users to mark an article as saved
    # to do: mark article as saved by id instead
    @app.put("/mark-saved/")
    async def mark_article_as_saved(desc: dict = Body(...)):
        self.user_saved_articles.insert_one(desc)
        st = "Article", desc["Title"], "saved!"
        return {"response": st}
    
content_api = ContentAPI(user_id = "sample_user_id")
app = content_api.app