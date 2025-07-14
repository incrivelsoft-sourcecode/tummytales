# Content Agent API

This project is a FastAPI application that provides an API for uploading PDF files, parsing their content, and generating vector embeddings using Hugging Face models. The application connects to MongoDB for data storage and Pinecone for vector storage.

## Requirements

Before running the application, ensure you have the following environment variables set:

- `MONGODB_URL`: Connection string for MongoDB.
- `PINECONE_KEY`: API key for Pinecone.

## Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd content_agent
   ```

2. Install the required dependencies:

   ```
   pip install -r requirements.txt
   ```

## Docker

To build and run the Docker image for the FastAPI application, follow these steps:

1. Build the Docker image:

   ```
   docker build -t content_agent .
   ```

2. Run the Docker container:

   ```
   docker run -d -p 8000:8000 content_agent
   ```

3. Access the API at `http://localhost:8000`.

## API Endpoints

- `GET /`: Returns a welcome message.
- `POST /file`: Uploads a PDF file, parses its content, and stores it in MongoDB and Pinecone.