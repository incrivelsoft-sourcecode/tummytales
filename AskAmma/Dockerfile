# Use a slim base image with Python
FROM python:3.10-slim

WORKDIR /app

# Install necessary dependencies
RUN apt-get update && \
    apt-get install -y git curl && \
    pip install --upgrade pip

# Copy requirements and install
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy all project files
COPY . .

# Environment variables
ENV PYTHONUNBUFFERED=1

# Expose FastAPI port
EXPOSE 8000

# Run FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]