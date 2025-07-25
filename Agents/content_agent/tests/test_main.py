import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
import sys
import os

# Add Agents directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

# Add import for Agents module
from Agents.content_agent.main import ContentAPI

# filepath: Agents/content_agent/tests/test_main.py
content_api = ContentAPI()
app = content_api.app
client = TestClient(app)

@pytest.fixture
def mock_mongo_insert():
    with patch("Agents.content_agent.main.collection.insert_one") as mock:
        yield mock


def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "This is the Content API!"}

@pytest.mark.asyncio
async def test_parse_rss():
    rss_url = "http://example.com/rss"
    with patch("Agents.content_agent.main.feedparser.parse") as mock_feedparser:
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

# to do: add methods for testing saved news user feature