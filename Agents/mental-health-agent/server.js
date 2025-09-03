require('dotenv').config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const quizRoutes = require("./routes/quizRoutes");
const agentRoutes = require("./routes/agentRoutes");

// Helper function to delay (wait) for ms milliseconds
const delay = ms => new Promise(res => setTimeout(res, ms));


// Initialize services
async function startServer() {
  // Optionally, wait a bit to let dependencies like Mongo and Pinecone start up
  if (process.env.WAIT_FOR_SERVICES === "true") {
    console.log("Waiting 15 seconds for services to become available...");
    await delay(15000);
  }

  console.log("Starting service initialization...");

  // Connect to MongoDB
  await connectDB();
  console.log("✅ MongoDB connected");

  // Pinecone v2: No need to initialize
  // If you need to check the Pinecone connection, you can do a dummy call here if you want.

  // Create Express app
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Mount routes
  app.use("/api", quizRoutes);
  app.use("/api", agentRoutes);

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

// docker compose up --build
