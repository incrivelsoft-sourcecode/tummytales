# Use Python 3.10 slim image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies in smaller chunks for reliability
RUN pip install --no-cache-dir --timeout=1000 \
    fastapi>=0.104.1 \
    uvicorn>=0.24.0 \
    pydantic>=2.5.1 \
    python-dotenv>=1.0.0 \
    httpx>=0.24.0 \
    anthropic>=0.54.0 \
    motor>=3.0.0 \
    pymongo>=4.0.0

RUN pip install --no-cache-dir --timeout=1000 \
    pinecone-client>=3.0.0 \
    sentence-transformers>=2.2.0

RUN pip install --no-cache-dir --timeout=1000 \
    langchain>=0.1.0 \
    langchain-community>=0.0.16 \
    langchain-core>=0.1.0 \
    langchain-openai>=0.0.2 \
    langchain-pinecone>=0.1.1

RUN pip install --no-cache-dir --timeout=1000 \
    crewai==0.120.1 \
    crewai-tools>=0.17.0

# Copy application code
COPY . .

# Expose port
EXPOSE 5001

# Command to run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001"]