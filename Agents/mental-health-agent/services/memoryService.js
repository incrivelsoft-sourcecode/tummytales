// services/memoryService.js
require("dotenv").config();
const { Pinecone } = require("@pinecone-database/pinecone");
const { CohereClient } = require("cohere-ai");

// ---------- Clients ----------
const cohere = new CohereClient({ token: process.env.COHERE_API_KEY }); // correct: token
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// Use whichever env you set for your index name
const pineconeIndex = pinecone.index(
  process.env.PINECONE_INDEX || process.env.PINECONE_INDEX_NAME
);

// ---------- Embeddings ----------
async function getEmbeddings(texts, input_type = "search_document") {
  const resp = await cohere.embed({
    model: "embed-english-v3.0",
    texts,
    input_type, // snake_case is correct for Cohere
  });
  return resp.embeddings; // number[][]
}

// ---------- Metadata Sanitizer ----------
/**
 * Pinecone metadata must be: string | number | boolean | string[]
 * - Arrays -> list of strings
 * - Objects -> JSON string
 * - Special-case `answers` to always be list of strings, plus `answers_raw_json` (string)
 */
function toPineconeSafeMetadata(metadata = {}) {
  const out = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Special case: answers (common offender)
    if (key === "answers") {
      if (Array.isArray(value)) {
        out.answers = value.map((v) => {
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
      } else if (value && typeof value === "object") {
        out.answers = [JSON.stringify(value)];
      } else {
        out.answers = value == null ? [] : [String(value)];
      }
      out.answers_raw_json = JSON.stringify(value ?? null);
      continue;
    }

    // General coercion
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

// ---------- Upsert ----------
/**
 * @param {string[]} ids
 * @param {string[]} texts
 * @param {Object[]} metadataArr
 * @param {string=} namespace
 */
async function upsertTexts(ids, texts, metadataArr = [], namespace) {
  try {
    if (!Array.isArray(ids) || !Array.isArray(texts) || ids.length !== texts.length) {
      throw new Error("ids and texts must be arrays of equal length");
    }

    const embeddings = await getEmbeddings(texts, "search_document");

    const vectors = ids.map((id, i) => ({
      id,
      values: embeddings[i],
      metadata: toPineconeSafeMetadata({
        ...(metadataArr[i] || {}),
        text: texts[i], // keeping original text in metadata is fine
      }),
    }));

    // ✅ Correct call signature for current Pinecone JS client:
    // upsert(arrayOfRecords, { namespace }?)
    if (namespace) {
      await pineconeIndex.upsert(vectors, { namespace });
    } else {
      await pineconeIndex.upsert(vectors);
    }

    console.log("✅ Pinecone upsert successful");
  } catch (err) {
    console.error("❌ Pinecone upsert failed:", err);
    throw err;
  }
}

// ---------- Query ----------
/**
 * @param {string} queryText
 * @param {number} topK
 * @param {Object=} metadataFilter optional Pinecone filter
 * @param {string=} namespace
 */
async function queryText(queryText, topK = 3, metadataFilter, namespace) {
  try {
    const [embedding] = await getEmbeddings([queryText], "search_query");
    const payload = {
      vector: embedding,
      topK,
      includeMetadata: true,
    };
    if (namespace) payload.namespace = namespace;
    if (metadataFilter && Object.keys(metadataFilter).length) {
      payload.filter = metadataFilter;
    }

    const result = await pineconeIndex.query(payload);
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
  initializePinecone,
  toPineconeSafeMetadata,
};
