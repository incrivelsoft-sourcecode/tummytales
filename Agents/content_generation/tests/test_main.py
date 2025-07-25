import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
import sys
import os

# Add Agents directory to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))

# Add import for Agents module
from Agents.content_generation.main import RAGAPI

# filepath: Agents/content_agent/tests/test_main.py
rag_api = RAGAPI()
app = rag_api.app
client = TestClient(app)

@pytest.fixture
def mock_parse_pdf():
    with patch("Agents.content_agent.main.RAGAPI.parse_pdf", new_callable=AsyncMock) as mock:
        mock.return_value = ["Sample parsed text"]
        yield mock

@pytest.fixture
def mock_mongo_insert():
    with patch("Agents.content_agent.main.collection.insert_one") as mock:
        yield mock

@pytest.fixture
def mock_vector_embeddings():
    with patch("Agents.content_agent.main.vector_embeddings", new_callable=AsyncMock) as mock:
        yield mock

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "This is the Content Generation API! (For Internal Use Only)"}

@pytest.mark.asyncio
async def test_upload_file_valid_pdf(mock_parse_pdf, mock_mongo_insert, mock_vector_embeddings):
    file_content = b"%PDF-1.4 Sample PDF content"
    files = {"file": ("test.pdf", file_content, "application/pdf")}
    response = client.post("/file/", files=files)
    assert response.status_code == 200
    assert response.json() == {"File parsed & uploaded!": "test.pdf"}
    mock_parse_pdf.assert_called_once()
    mock_mongo_insert.assert_called_once()
    mock_vector_embeddings.assert_called_once()

def test_upload_file_invalid_file_type():
    file_content = b"Sample text content"
    files = {"file": ("test.txt", file_content, "text/plain")}
    response = client.post("/file/", files=files)
    assert response.status_code == 200
    assert response.json() == {"Error": "Only PDF files are supported."}

@pytest.mark.asyncio
async def test_generate_content():
    query = "What is the impact of nutrition on pregnancy?"
    with patch("Agents.content_agent.main.HuggingFaceEmbeddings.embed_query", return_value=[0.1, 0.2, 0.3]) as mock_embed_query, \
         patch("Agents.content_agent.main.RAGAPI.pc.Index.query", return_value={"matches": [{"id": "doc1"}]}) as mock_pinecone_query, \
         patch("Agents.content_agent.main.RAGAPI.claude.messages.create", return_value="Generated response") as mock_claude:
        response = client.post("/request/", json={"query": query})
        assert response.status_code == 200
        assert response.json() == {"response": "Generated response"}
        mock_embed_query.assert_called_once()
        mock_pinecone_query.assert_called_once()
        mock_claude.assert_called_once()