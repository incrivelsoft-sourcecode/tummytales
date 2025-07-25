import os
from dotenv import load_dotenv
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_pinecone import Pinecone as LangchainPinecone
from langchain.chains import RetrievalQA
from langchain_groq import ChatGroq

load_dotenv()

def run_rag_query(user_query: str):
    # 🔐 Load API Keys
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    pinecone_index_name = os.getenv("PINECONE_INDEX_NAME")
    groq_api_key = os.getenv("GROQ_API_KEY")
    openai_api_key = os.getenv("OPENAI_API_KEY")

    # 🧠 Embeddings
    embedding = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=openai_api_key
    )

    # 📚 Vectorstore
    vectorstore = LangchainPinecone.from_existing_index(
        index_name=pinecone_index_name,
        embedding=embedding
    )

    # 🔍 Retriever + LLM Chain
    retriever = vectorstore.as_retriever()
    llm = ChatGroq(model="llama3-8b-8192", api_key=groq_api_key)

    qa = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        return_source_documents=True
    )

    # 🚀 Run Query
    result = qa.invoke({"query": user_query})

    return {
        "answer": result["result"],
        "sources": [doc.metadata.get("source", "Unknown source") for doc in result["source_documents"]]
    }