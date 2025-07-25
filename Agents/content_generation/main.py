
import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Request, Body
import pymupdf
from pinecone import Pinecone
from pymongo import MongoClient
from langchain_community.embeddings import HuggingFaceEmbeddings
import langchain_text_splitters
import feedparser
import anthropic
from fastapi.middleware.cors import CORSMiddleware
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import Pinecone as LangChainPinecone
from langchain.prompts import PromptTemplate
from langchain_community.llms import Anthropic

load_dotenv()

class RAGAPI:
    client = MongoClient(os.getenv("MONGODB_URL"))
    db = client.get_database(os.getenv("MONGODB_DB_NAME"))
    collection = db.get_collection("content_base_knowledge")

    #pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    pc = None

    # replace with the actual embedding model we use
    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    hf_token = os.getenv("HF_API_KEY")
    initialized = False

    #for LLM
    claude = anthropic.Anthropic(api_key=os.getenv("CLAUDE_KEY"))
    #fastapi setup
    app = FastAPI()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:8000",
            "https://tummytales.info",
            "https://www.tummytales.info"
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST"],
        allow_headers=["*"]
    )

#welcome message (test)
    @app.get("/")
    def read_root():
        return {"Hello": "This is the Content Generation API! (For Internal Use Only)"}

    #upload pdf for parsing
    @app.post("/file/")
    async def upload_file(file: UploadFile = File(...)):
        if not file.filename.endswith('.pdf'):
            return {"Error": "Only PDF files are supported."}
        file_content = await file.read()
        txts = await RAGAPI.parse_pdf(file_content)
        RAGAPI.collection.insert_one({"filename": file.filename, "text": txts})
        RAGAPI.vector_embeddings(file.filename, txts)
        return {"File parsed & uploaded!": file.filename}
    
    #content generation with rag using pinecone & langchain
    @app.post("/request/")
    async def generate_content(request):
        # Extract query from request
        data = await request.json()
        query = data.get("query")
        if not query:
            return {"error": "No query provided."}

        # Retrieve relevant document chunks using LangChain
        vector_store = LangChainPinecone(
            api_key=os.getenv("PINECONE_API_KEY"),
            environment=os.getenv("PINECONE_ENV"),
            index_name=RAGAPI.collection.find_one(sort=[("_id", -1)])["filename"]
        )

        # Define the prompt template
        prompt_template = PromptTemplate(
            input_variables=["context", "query"],
            template="Context: {context}\n\nQuery: {query}\n\n"
        )

        # Initialize the LLM
        llm = Anthropic(api_key=os.getenv("CLAUDE_KEY"))

        # Create the RetrievalQA chain
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            retriever=vector_store.as_retriever(),
            prompt=prompt_template
        )

        # Generate the response
        response = qa_chain.run(query)

        return {"response": response}

    #helper methods
    async def parse_pdf(file):
        txt = ""
        pdf_document = pymupdf.open(stream=file, filetype="pdf")
        for page in pdf_document:
            txt += page.get_text()
        #tries to split text into paragraphs, natural breaks, etc
        text_splitter = langchain_text_splitters.RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=0)
        txts = text_splitter.split_text(txt)
        return txts

    async def vector_embeddings(filename, texts):
        # replace with the actual embedding model we use
        embedder = HuggingFaceEmbeddings(model_name=RAGAPI.model_name)
        embedding = []
        for text in texts:
            embedding.append(embedder.embed_query(text))
        RAGAPI.pc.create_index(filename, dimension=384)
        RAGAPI.pc.Index(filename).upsert(vectors=[{"id": filename, "values": embedding}])
        return embedding
    
rag_api = RAGAPI()
app = rag_api.app