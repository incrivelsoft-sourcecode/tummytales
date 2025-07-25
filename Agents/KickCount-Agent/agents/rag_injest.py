import os
from dotenv import load_dotenv
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_pinecone import Pinecone as LangchainPinecone
from pinecone import Pinecone, ServerlessSpec
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import PyPDFLoader

load_dotenv()

# ✅ Load env
OPEN_AI_API_KEY = os.getenv("OPENAI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME")
PINECONE_REGION = os.getenv("PINECONE_REGION")

# ✅ Load documents
data_dir = "C:/Work progress/tummytales/KickCount-Agent/data"
all_chunks = []

for filename in os.listdir(data_dir):
    if filename.endswith(".pdf"):
        loader = PyPDFLoader(os.path.join(data_dir, filename))
        pages = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
        chunks = text_splitter.split_documents(pages)
        all_chunks.extend(chunks)

print(f"🔍 Ready to upsert {len(all_chunks)} clean chunks")

# ✅ Create embedding model
embedding = OpenAIEmbeddings(
    model ="text-embedding-3-small",
    openai_api_key=OPEN_AI_API_KEY,
)

# ✅ Init Pinecone client correctly
pc = Pinecone(api_key=PINECONE_API_KEY)

# ✅ Create index if it does not exist
if PINECONE_INDEX_NAME not in pc.list_indexes().names():
    pc.create_index(
        name=PINECONE_INDEX_NAME,
        dimension=1536,  # Dimension for text-embedding-3-small
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region=PINECONE_REGION)
    )

index = pc.Index(PINECONE_INDEX_NAME)

# ✅ Connect Langchain wrapper
vectorstore = LangchainPinecone(index, embedding, "text")

# ✅ Store chunks
vectorstore.add_documents(all_chunks)

print(f"✅ Successfully embedded and upserted {len(all_chunks)} chunks to Pinecone index '{PINECONE_INDEX_NAME}'.")
