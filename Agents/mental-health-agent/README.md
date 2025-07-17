# Mental Health Agent Backend

This is a Node.js backend for a mental health chatbot designed to support pregnant women. It uses MongoDB for storage, Pinecone for vector search (RAG), and Cohere for large language model (LLM) chat and embedding. No local ChromaDB required.

## Features

- Stores quiz and chat history in MongoDB
- Uses Pinecone for Retrieval-Augmented Generation (RAG) to pull contextually relevant past chats or quiz results
- Integrates with Cohere API for conversational AI and text embeddings
- RESTful API for quizzes, chat, and scoring

## Technologies

- Node.js (Express)
- MongoDB Atlas
- Pinecone vector database
- Cohere LLM API

## Requirements

- Node.js v18+
- MongoDB Atlas cluster (or compatible MongoDB)
- Pinecone project & index (e.g., `mental-health-memory`)
- Cohere API key

