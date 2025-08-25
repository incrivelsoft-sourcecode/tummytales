import os
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings
from langchain_pinecone import PineconeVectorStore
from langchain_groq import ChatGroq
from langchain.chains import RetrievalQA

load_dotenv()

PINECONE_API_KEY   = os.environ["PINECONE_API_KEY"]
PINECONE_INDEX     = os.environ["PINECONE_INDEX_NAME"]
GROQ_API_KEY       = os.environ["GROQ_API_KEY"]
OPENAI_API_KEY     = os.environ["OPENAI_API_KEY"]

# 1️⃣  One embedding model – 384 dims
embedding = OpenAIEmbeddings(
    model="text-embedding-3-small",
    dimensions=384,
    openai_api_key=OPENAI_API_KEY,
)

# 2️⃣  Re‑use the **existing** index
vectorstore = PineconeVectorStore.from_existing_index(
    index_name=PINECONE_INDEX,
    embedding=embedding,
)

retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

llm = ChatGroq(model="llama3-8b-8192", api_key=GROQ_API_KEY)

qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=retriever,
    chain_type="stuff"
)


def query(question: str) -> str:
    """
    Synchronous helper used by the feedback controller.
    """
    result = qa_chain.invoke({"query": question})
    return result["result"]

class RAGEngine:
    """Back‑compat shim so other modules can still do
    `await RAGEngine.query("…")`."""

    @staticmethod
    async def query(text: str):
        # no 'await' here – query() is sync
        return query(text)