require("dotenv").config();
const { Pinecone } = require("@pinecone-database/pinecone");
const { CohereClient } = require("cohere-ai");

// Pinecone setup
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY
});
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME);

const cohereEmbedder = {
  generate: async (texts, input_type = "search_document") => {
    const response = await cohere.embed({
      model: "embed-english-v3.0",
      texts,
      input_type // <--- correct
    });
    return response.embeddings;
  }
};


// Helper to upsert vectors (add/update)
async function upsertVectors(ids, texts, metadataArr = []) {
  const embeddings = await cohereEmbedder.generate(texts, "search_document");
  const vectors = embeddings.map((values, i) => ({
    id: ids[i],
    values,
    metadata: metadataArr[i] || {}
  }));
  await pineconeIndex.upsert({ vectors });
}

// Helper to query vectors (find most similar)
async function queryVector(queryText, topK = 3) {
  const [embedding] = await cohereEmbedder.generate([queryText], "search_query");
  const result = await pineconeIndex.query({
    vector: embedding,
    topK,
    includeMetadata: true
  });
  return result.matches;
}

module.exports = {
  upsertVectors,
  queryVector
};
