# Use slim image with Python
FROM python:3.10-slim

# Environment optimizations
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set working directory
WORKDIR /app

# Install essential system and SSL libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libssl-dev \
    libffi-dev \
    curl \
    ca-certificates \
    gnupg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies first
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the entire app
COPY . .

# Expose the correct port
EXPOSE 6001

# Use uvicorn for FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "6001", "--reload"]



# # Use Python slim image
# FROM python:3.10-slim

# ENV PYTHONDONTWRITEBYTECODE=1 \
#     PYTHONUNBUFFERED=1 \
#     PIP_NO_CACHE_DIR=1 \
#     PIP_DISABLE_PIP_VERSION_CHECK=1

# WORKDIR /app

# RUN apt-get update && apt-get install -y --no-install-recommends \
#     gcc \
#     && apt-get clean && rm -rf /var/lib/apt/lists/*

# COPY requirements.txt .

# RUN pip install --upgrade pip && pip install -r requirements.txt

# COPY . .

# # ✅ Expose correct port
# EXPOSE 6001

# # ✅ Command to run your app (adjust if using Flask/FastAPI/Uvicorn)
# CMD ["python", "main.py"]
