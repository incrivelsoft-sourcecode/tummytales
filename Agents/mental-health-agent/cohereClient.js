// cohereClient.js
require("dotenv").config();

const { CohereClient } = require("cohere-ai");

// 1) Make sure your .env contains CO_API_KEY
if (!process.env.CO_API_KEY) {
  throw new Error("Missing CO_API_KEY in your .env");
}

// 2) Instantiate the v7 client (no init())
const cohere = new CohereClient({
  apiKey: process.env.CO_API_KEY
});

module.exports = cohere;
