FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install essential OS packages including OpenSSL (for MongoDB Atlas TLS)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    libssl-dev \
    openssl \
    ca-certificates \
    curl \
    netbase \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

EXPOSE 6001

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
