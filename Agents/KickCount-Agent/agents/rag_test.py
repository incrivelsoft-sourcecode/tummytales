from rag_query import query_rag

query = "How effective is tracking fetal movements in reducing stillbirth rates?"
result = query_rag(query)

print("🧠 RAG Answer:\n", result)
