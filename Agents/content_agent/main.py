# filepath: content_agent/main.py
import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File
import pymupdf
from pinecone import Pinecone
from pymongo import MongoClient
from langchain_community.embeddings import HuggingFaceEmbeddings
import langchain_text_splitters
import feedparser

#embedding vector size 1024
load_dotenv()

class ContentAPI:
    def __init__(self):
        self.client = MongoClient(os.getenv("MONGODB_URL"))
        self.db = self.client.get_database("your_database_name")
        self.collection = self.db.get_collection("content_base_knowledge")
        self.rss_feeds = self.db.get_collection("rss_feeds")
        self.pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

        # replace with the actual embedding model we use
        self.model_name = "sentence-transformers/all-MiniLM-L6-v2"
        self.hf_token = os.getenv("HF_API_KEY")
        self.initialized = False

        #for news aggregation
        #self.news_stories = [] #currently just returning each set of news stories as we parse the rss feed url
        
    app = FastAPI()

    #welcome message (test)
    @app.get("/")
    def read_root():
        return {"Hello": "This is the Content API!"}

    #upload pdf for parsing
    @app.post("/file")
    async def upload_file(self, file: UploadFile = File(...)):
        if not file.filename.endswith('.pdf'):
            return {"Error": "Only PDF files are supported."}
        file_content = await file.read()
        txts = await self.parse_pdf(file_content)
        self.collection.insert_one({"filename": file.filename, "text": txts})
        self.vector_embeddings(file.filename, txts)
        return {"File parsed & uploaded!": file.filename}
    
    #content generation with rag using pinecone & langchain
    @app.post("/request")
    async def generate_content(self, request):
        # Extract query from request
        data = await request.json()
        query = data.get("query")
        if not query:
            return {"error": "No query provided."}

        # Retrieve relevant document chunks from Pinecone
        embedder = HuggingFaceEmbeddings(model_name=self.model_name)
        query_embedding = embedder.embed_query(query)
        index_name = self.collection.find_one(sort=[("_id", -1)])["filename"]
        index = self.pc.Index(index_name)
        search_results = index.query(vector=query_embedding, top_k=3, include_values=False)
        ids = [match["id"] for match in search_results["matches"]]
        docs = self.collection.find({"filename": {"$in": ids}})
        context = " ".join([" ".join(doc["text"]) for doc in docs])

        # Placeholder for LLM response (replace with actual LLM call)

        response = f"Context: {context}\n\nQuery: {query}\n\n[LLM response here]"

        return {"response": response}

    #adds rss feed info to mongodb, returns news stories from url as a list
    @app.post("/rss-url")
    async def parse_rss(self, url):
        feed = feedparser.parse(url)
        self.rss_feeds.insert_one({"URL":url, "Title": feed.feed.title,"Description": feed.feed.description, "Feed":feed})
        news_stories = []
        for entry in feed.entries:
            desc = {"Title": entry.title, "Link":entry.link, "Date":"", "Summary":""}
            if hasattr(entry, "published"):
                desc["Date"] = entry.published
            if hasattr(entry, "summary"):
                desc["Summary"] = entry.summary
            news_stories.append(desc)
        return {"news_stories": news_stories}
            
    #helper methods
    async def parse_pdf(self, file):
        txt = ""
        pdf_document = pymupdf.open(stream=file, filetype="pdf")
        for page in pdf_document:
            txt += page.get_text()
        #tries to split text into paragraphs, natural breaks, etc
        text_splitter = langchain_text_splitters.RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=0)
        txts = text_splitter.split_text(txt)
        return txts

    async def vector_embeddings(self, filename, texts):
        # replace with the actual embedding model we use
        embedder = HuggingFaceEmbeddings(model_name=self.model_name)
        if not self.initialized:
            self.initialize() 
        embedding = []
        for text in texts:
            embedding.append(embedder.embed_query(text))



        self.pc.create_index(filename, dimension=384)
        self.pc.Index(filename).upsert(vectors=[{"id": filename, "values": embedding}])
        return embedding
    
content_api = ContentAPI()
app = content_api.app