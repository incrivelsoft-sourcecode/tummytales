# Use NVIDIA PyTorch image with CUDA + Python preinstalled
FROM nvcr.io/nvidia/pytorch:24.02-py3

# Set working directory
WORKDIR /app

# Install OS packages if needed (curl, git, etc.)
RUN apt-get update && apt-get install -y \
    git \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip and install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose FastAPI port
EXPOSE 8000

# Run the FastAPI app using uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]