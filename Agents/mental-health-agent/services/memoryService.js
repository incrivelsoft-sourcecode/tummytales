require("dotenv").config();
const { Pinecone } = require("@pinecone-database/pinecone");
const { CohereClient } = require("cohere-ai"); // For embedding

// Setup Cohere for embeddings
const cohere = new CohereClient({ apiKey: process.env.COHERE_API_KEY });

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX);

// Helper: Get embedding using Cohere
async function getEmbeddings(texts) {
  const resp = await cohere.embed({
    model: "embed-english-v3.0",
    texts,
    inputType: "search_document",
  });
  return resp.embeddings;
}

// Upsert documents: requires embedding!
async function upsertTexts(ids, texts, metadataArr = []) {
  try {
    const embeddings = await getEmbeddings(texts);
    const vectors = ids.map((id, i) => ({
      id,
      values: embeddings[i], // <--- pass embedding here!
      metadata: { ...(metadataArr[i] || {}), text: texts[i] } // store text in metadata
    }));
    await pineconeIndex.upsert(vectors);
    console.log("✅ Pinecone upsert successful");
  } catch (err) {
    console.error("❌ Pinecone upsert failed:", err);
    throw err;
  }
}

// Query similar docs (requires embedding for query)
async function queryText(queryText, topK = 3) {
  try {
    const [embedding] = await getEmbeddings([queryText]);
    const result = await pineconeIndex.query({
      vector: embedding,   // <--- send embedding, not text
      topK,
      includeMetadata: true
    });
    return result.matches || [];
  } catch (err) {
    console.error("❌ Pinecone query failed:", err);
    throw err;
  }
}

async function initializePinecone() {
  try {
    await pineconeIndex.describeIndexStats();
    console.log("✅ Pinecone index ready");
  } catch (err) {
    console.error("❌ Failed to connect to Pinecone:", err);
    throw err;
  }
}

module.exports = {
  upsertTexts,
  queryText,
  initializePinecone
};
