// vector.js
require("dotenv").config();
const { Pinecone } = require("@pinecone-database/pinecone");
const { CohereClient } = require("cohere-ai");

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME);
const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });

const cohereEmbedder = {
  generate: async (texts, input_type = "search_document") => {
    const res = await cohere.embed({
      model: "embed-english-v3.0",
      texts,
      input_type,
    });
    return res.embeddings;
  },
};

// ---- STRICT sanitizer (forces Pinecone-compatible types) ----
function toPineconeSafeMetadata(metadata = {}) {
  const out = {};
  for (const [key, value] of Object.entries(metadata)) {
    // Special-case 'answers' since it's the field failing
    if (key === "answers") {
      if (Array.isArray(value)) {
        out.answers = value.map((v) => {
          if (v == null) return "";
          if (typeof v === "string") return v;
          if (typeof v === "number" || typeof v === "boolean") return String(v);
          // common shapes from quiz/follow-ups
          return (
            v.label ??
            v.text ??
            v.name ??
            v.title ??
            v.option ??
            v.id ??
            v.value ??
            JSON.stringify(v)
          );
        });
      } else if (value && typeof value === "object") {
        // single object -> store JSON string
        out.answers = [JSON.stringify(value)];
      } else {
        out.answers = value == null ? [] : [String(value)];
      }
      // Keep a raw copy (string) if you need to inspect later
      out.answers_raw_json = JSON.stringify(value ?? null);
      continue;
    }

    // General handling for other keys
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = value;
      continue;
    }

    if (Array.isArray(value)) {
      out[key] = value.map((v) => {
        if (v == null) return "";
        if (typeof v === "string") return v;
        if (typeof v === "number" || typeof v === "boolean") return String(v);
        return (
          v.label ??
          v.text ??
          v.name ??
          v.title ??
          v.option ??
          v.id ??
          v.value ??
          JSON.stringify(v)
        );
      });
      continue;
    }

    if (value && typeof value === "object") {
      out[key] = JSON.stringify(value);
      continue;
    }

    out[key] = value == null ? "" : String(value);
  }
  return out;
}

async function upsertVectors(ids, texts, metadataArr = [], namespace) {
  if (!Array.isArray(ids) || !Array.isArray(texts) || ids.length !== texts.length) {
    throw new Error("ids and texts must be arrays of equal length");
  }

  const embeddings = await cohereEmbedder.generate(texts, "search_document");

  const vectors = embeddings.map((values, i) => {
    const rawMeta = metadataArr[i] || {};
    const metadata = toPineconeSafeMetadata(rawMeta);
    return { id: ids[i], values, metadata };
  });

  const payload = namespace ? { vectors, namespace } : { vectors };
  await pineconeIndex.upsert(payload);
}

async function queryVector(queryText, topK = 3, namespace) {
  const [embedding] = await cohereEmbedder.generate([queryText], "search_query");
  const payload = { vector: embedding, topK, includeMetadata: true };
  if (namespace) payload.namespace = namespace;
  const result = await pineconeIndex.query(payload);
  return result.matches;
}

module.exports = { upsertVectors, queryVector, toPineconeSafeMetadata };
