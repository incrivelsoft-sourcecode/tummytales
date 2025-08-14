import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
import os
import sys

# Add import for Agents module
from main import ContentAPI

content_api = ContentAPI(user_id="")
app = content_api.app
client = TestClient(app)

# currently all methods return 404 since mongodb not set up yet
# to do: fix 3 below to insert/find in right database
@pytest.fixture
def mock_mongo_insert():
    with patch("content_agent.main.ContentAPI.rss_feeds.insert_one") as mock:
        yield mock

@pytest.fixture
def mock_mongo_find():
    with patch("content_agent.main.ContentAPI.rss_feeds.find") as mock:
        yield mock

@pytest.fixture
def mock_mongo_find_one():
    with patch("content_agent.main.ContentAPI.rss_feeds.find_one") as mock:
        yield mock

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "This is the Content Aggregation API!"}

@pytest.mark.asyncio
async def test_parse_rss():
    rss_url = "http://example.com/rss"
    with patch("content_agent.main.feedparser.parse") as mock_feedparser:
        mock_feedparser.return_value = {
            "feed": {"title": "Example Feed", "description": "Sample RSS Feed"},
            "entries": [
                {"title": "News 1", "link": "http://example.com/news1", "summary": "Summary 1"},
                {"title": "News 2", "link": "http://example.com/news2", "summary": "Summary 2"},
            ],
        }
        response = client.post("/rss-url/", json={"rss_url": rss_url})
        assert response.status_code == 200
        assert response.json() == {
            "news_stories": [
                {"Title": "News 1", "Link": "http://example.com/news1", "Date": "", "Summary": "Summary 1"},
                {"Title": "News 2", "Link": "http://example.com/news2", "Date": "", "Summary": "Summary 2"},
            ]
        }

@pytest.mark.asyncio
async def test_save_news(mock_mongo_insert):
    news_item = {
        "Title": "News 1",
        "Link": "http://example.com/news1",
        "Date": "2023-01-01",
        "Summary": "Summary 1",
    }
    response = client.post("/save-news/", json=news_item)
    assert response.status_code == 200
    assert response.json() == {"message": "News saved successfully!"}
    mock_mongo_insert.assert_called_once_with(news_item)

@pytest.mark.asyncio
async def test_get_saved_news(mock_mongo_find):
    mock_mongo_find.return_value = [
        {"Title": "News 1", "Link": "http://example.com/news1", "Date": "2023-01-01", "Summary": "Summary 1"},
        {"Title": "News 2", "Link": "http://example.com/news2", "Date": "2023-01-02", "Summary": "Summary 2"},
    ]
    response = client.get("/saved-news/")
    assert response.status_code == 200
    assert response.json() == {
        "saved_news": [
            {"Title": "News 1", "Link": "http://example.com/news1", "Date": "2023-01-01", "Summary": "Summary 1"},
            {"Title": "News 2", "Link": "http://example.com/news2", "Date": "2023-01-02", "Summary": "Summary 2"},
        ]
    }
    mock_mongo_find.assert_called_once()

@pytest.mark.asyncio
async def test_get_saved_news_by_user(mock_mongo_find):
    user_id = "user123"
    mock_mongo_find.return_value = [
        {"Title": "News 1", "Link": "http://example.com/news1", "Date": "2023-01-01", "Summary": "Summary 1", "user_id": user_id},
        {"Title": "News 2", "Link": "http://example.com/news2", "Date": "2023-01-02", "Summary": "Summary 2", "user_id": user_id},
    ]
    response = client.get(f"/saved-news/{user_id}")
    assert response.status_code == 200
    assert response.json() == {
        "saved_news": [
            {"Title": "News 1", "Link": "http://example.com/news1", "Date": "2023-01-01", "Summary": "Summary 1"},
            {"Title": "News 2", "Link": "http://example.com/news2", "Date": "2023-01-02", "Summary": "Summary 2"},
        ]
    }
    mock_mongo_find.assert_called_once_with({"user_id": user_id})
