# Content Agent API

This project is a FastAPI application that provides an API for personalized news aggregation.

## Requirements

Before running the application, ensure you have the following environment variables set:

- `MONGODB_URL`: Connection string for MongoDB.

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
   docker build -t content_agent:latest agents/content_agent
   ```

2. Run the Docker container:

   ```
   docker run -d -p 8000:8000 content_agent:latest
   ```

3. Access the API at `http://localhost:8000`.
4. Access docs at `http://localhost:8000/docs`

## API Endpoints

- `GET /`: Returns a welcome message.
- `POST /rss-url`: Returns news from rss feed and saves rss feed to MongoDB
- `POST /news-query`: Claude gets online relevant news based on query
- `PUT /mark-saved`: User can mark a news story as saved; stores news info in MongoDB

## Testing
Run tests with
```
pytest Agents/content_agent/test_main.py
```