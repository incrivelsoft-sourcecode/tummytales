FROM ollama/ollama:latest

WORKDIR /app

# Install Python and dependencies
RUN apt-get update && \
    apt-get install -y python3 python3-pip git curl && \
    pip3 install --upgrade pip

# Copy requirements and install
COPY requirements.txt .
RUN pip3 install -r requirements.txt

# Copy all project files
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV OLLAMA_MODEL=llama3
ENV OLLAMA_BASE_URL=http://localhost:11434

# Expose ports
EXPOSE 8000
EXPOSE 11434

# Pull the model and start services at runtime
ENTRYPOINT []
CMD ["sh", "-c", "ollama serve & sleep 5 && ollama pull $OLLAMA_MODEL && uvicorn main:app --host 0.0.0.0 --port 8000"]