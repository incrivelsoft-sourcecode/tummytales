import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from content_agent.main import app

client = TestClient(app)

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
        response = client.post("/rss-url/", json={"url": rss_url})
        assert response.status_code == 200
        assert response.json() == {
            "news_stories": [
                {"Title": "News 1", "Link": "http://example.com/news1", "Date": "", "Summary": "Summary 1"},
                {"Title": "News 2", "Link": "http://example.com/news2", "Date": "", "Summary": "Summary 2"},
            ]
        }

@pytest.mark.asyncio
@patch("content_agent.main.get_user_city", return_value="Test City")
@patch("content_agent.main.get_user_state", return_value="Test State")
@patch("content_agent.main.get_user_country", return_value="Test Country")
@patch("content_agent.main.claude.messages.create")
async def test_get_relevant_news(mock_claude_create, mock_get_country, mock_get_state, mock_get_city):
    # Mock the response from the Claude API
    mock_claude_create.return_value = {
        "id": "msg_01Fp8b4A4g8p8g8g8g8g8g8g8g8g8g8g",
        "type": "message",
        "role": "assistant",
        "content": [
            {
                "type": "text",
                "text": "Here are some articles about pregnancy nutrition..."
            }
        ],
        "model": "claude-opus-4-20250514",
        "stop_reason": "end_turn",
        "usage": {
            "input_tokens": 10,
            "output_tokens": 25
        }
    }

    request_data = {
        "user_id": "test_user",
        "query": "pregnancy nutrition"
    }
    response = client.post("/news-query/", json=request_data)

    assert response.status_code == 200
    assert "response" in response.json()

@pytest.mark.asyncio
@patch("content_agent.main.save_user_article")
async def test_mark_article_as_saved(mock_save_user_article):
    request_data = {
        "user_id": "test_user",
        "desc": {
            "Title": "Test Article",
            "Link": "http://example.com/article"
        }
    }
    response = client.put("/mark-saved/", json=request_data)

    assert response.status_code == 200
    assert response.json() == {"response": "Article 'Test Article' saved!"}
    mock_save_user_article.assert_called_once_with("test_user", {"Title": "Test Article", "Link": "http://example.com/article"})