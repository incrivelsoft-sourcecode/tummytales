import os
from dotenv import load_dotenv, dotenv_values
from fastapi import FastAPI, UploadFile, File
import pymupdf
from pinecone import Pinecone
from pymongo import MongoClient
from langchain_community.embeddings import HuggingFaceEmbeddings

load_dotenv()
class ContentAPI:
    def __init__(self):
        # Replace with your MongoDB connection string
        self.client = MongoClient(os.getenv("MONGODB_URL"))
        # Access a specific database
        self.db = self.client.get_database("your_database_name")
        # Access a specific collection within the database
        self.collection = self.db.get_collection("your_collection_name")
        self.pc = Pinecone(api_key=os.getenv("PINECONE_KEY"))
        self.model_name = "sentence-transformers/all-MiniLM-L6-v2"
        self.initialized = False
        
    app = FastAPI()

    @app.get("/")
    def read_root():
        return {"Hello": "This is the Content API!"}

    @app.post("/file")
    async def upload_file(self, file: UploadFile = File(...)):
        #run file thru pymupdf
        if not file.filename.endswith('.pdf'):
            return {"Error": "Only PDF files are supported."}
        file_content = await file.read()
        txt = self.parse_pdf(file_content)
        # store file text in mongodb
        self.collection.insert_one({"filename": file.filename, "text": txt})
        #make vectors & store in pinecone
        self.vector_embeddings(file.filename, txt)
        return {"File parsed & uploaded!": file.filename}

    async def parse_pdf(self, file):
        txt = ""
        for page in file:
            txt += page.get_text()
        return txt

    async def vector_embeddings(self, filename, text):
        embedder = HuggingFaceEmbeddings(model_name = "sentence-transformers/all-MiniLM-L6-v2")
        if not self.initialized:
            self.initialize() 
        embedding = embedder.embed_query(text)
        self.pc.create_index(filename, dimension=384)
        self.pc.Index(filename).upsert(vectors=[{"id": filename, "values": embedding}])
        return embedding
    
ContentAPI()