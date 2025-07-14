# filepath: content_agent/main.py
import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
import pymupdf
from pinecone import Pinecone
from pymongo import MongoClient
from langchain_community.embeddings import HuggingFaceEmbeddings

load_dotenv()

class ContentAPI:
    def __init__(self):
        self.client = MongoClient(os.getenv("MONGODB_URL"))
        self.db = self.client.get_database("your_database_name")
        self.collection = self.db.get_collection("your_collection_name")
        self.pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

        # replace with the actual embedding model we use
        self.model_name = "sentence-transformers/all-MiniLM-L6-v2"
        self.hf_token = os.getenv("HF_API_KEY")
        self.initialized = False
        
    app = FastAPI()

    @app.get("/")
    def read_root():
        return {"Hello": "This is the Content API!"}

    @app.post("/file")
    async def upload_file(self, file: UploadFile = File(...)):
        if not file.filename.endswith('.pdf'):
            return {"Error": "Only PDF files are supported."}
        file_content = await file.read()
        txt = await self.parse_pdf(file_content)
        self.collection.insert_one({"filename": file.filename, "text": txt})
        self.vector_embeddings(file.filename, txt)
        return {"File parsed & uploaded!": file.filename}

    async def parse_pdf(self, file):
        txt = ""
        pdf_document = pymupdf.open(stream=file, filetype="pdf")
        for page in pdf_document:
            txt += page.get_text()
        return txt

    async def vector_embeddings(self, filename, text):
        # replace with the actual embedding model we use
        embedder = HuggingFaceEmbeddings(model_name=self.model_name)
        if not self.initialized:
            self.initialize() 
        embedding = embedder.embed_query(text)



        self.pc.create_index(filename, dimension=384)
        self.pc.Index(filename).upsert(vectors=[{"id": filename, "values": embedding}])
        return embedding
    
content_api = ContentAPI()
app = content_api.app