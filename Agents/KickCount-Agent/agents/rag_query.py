import os
from dotenv import load_dotenv
from langchain_pinecone import Pinecone as LangchainPinecone
from langchain_community.embeddings import OpenAIEmbeddings
from pinecone import Pinecone, ServerlessSpec
from langchain_groq import ChatGroq
from langchain.chains import RetrievalQA

load_dotenv()

class RAGEngine:
    @staticmethod
    async def query(query_text):
        pinecone_api_key = os.environ["PINECONE_API_KEY"]
        pinecone_index_name = os.environ["PINECONE_INDEX_NAME"]
        groq_api_key = os.environ["GROQ_API_KEY"]
        openai_api_key = os.environ["OPENAI_API_KEY"]

        embedding = OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=openai_api_key
        )

        # ✅ NEW PineconeVectorStore
        vectorstore = LangchainPinecone(
            index_name=pinecone_index_name,
            embedding=embedding,
            pinecone_api_key=pinecone_api_key
        )

        retriever = vectorstore.as_retriever()

        llm = ChatGroq(model="llama3-8b-8192", api_key=groq_api_key)

        qa = RetrievalQA.from_chain_type(llm=llm, retriever=retriever)
        result = qa.invoke({"query": query_text})
        return result["result"]
