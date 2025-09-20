#!/bin/bash

# Docker management script for Gamifier service

case "$1" in
    "build")
        echo "Building Gamifier Docker image..."
        docker build -t gamifier:latest .
        ;;
    "build-prod")
        echo "Building Gamifier production Docker image..."
        docker build -f Dockerfile.prod -t gamifier:prod .
        ;;
    "run")
        echo "Running Gamifier service..."
        docker run -d \
            --name gamifier-service \
            -p 5002:5002 \
            --env-file .env \
            gamifier:latest
        ;;
    "run-prod")
        echo "Running Gamifier service in production mode..."
        docker run -d \
            --name gamifier-service-prod \
            -p 5002:5002 \
            --env-file .env \
            gamifier:prod
        ;;
    "stop")
        echo "Stopping Gamifier service..."
        docker stop gamifier-service gamifier-service-prod 2>/dev/null || true
        docker rm gamifier-service gamifier-service-prod 2>/dev/null || true
        ;;
    "logs")
        echo "Showing logs for Gamifier service..."
        docker logs -f gamifier-service 2>/dev/null || docker logs -f gamifier-service-prod 2>/dev/null
        ;;
    "shell")
        echo "Opening shell in Gamifier container..."
        docker exec -it gamifier-service /bin/bash 2>/dev/null || docker exec -it gamifier-service-prod /bin/bash
        ;;
    "compose-up")
        echo "Starting with docker-compose..."
        docker-compose up -d
        ;;
    "compose-down")
        echo "Stopping with docker-compose..."
        docker-compose down
        ;;
    *)
        echo "Usage: $0 {build|build-prod|run|run-prod|stop|logs|shell|compose-up|compose-down}"
        echo ""
        echo "Commands:"
        echo "  build       - Build development Docker image"
        echo "  build-prod  - Build production Docker image"
        echo "  run         - Run development container"
        echo "  run-prod    - Run production container"
        echo "  stop        - Stop and remove containers"
        echo "  logs        - Show container logs"
        echo "  shell       - Open shell in container"
        echo "  compose-up  - Start with docker-compose"
        echo "  compose-down - Stop with docker-compose"
        exit 1
        ;;
esac
