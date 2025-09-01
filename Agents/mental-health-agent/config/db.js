// config/db.js
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI;
const DBNAME = process.env.MONGO_DBNAME || 'tummytales-dev';

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: DBNAME,               // ← force your unified DB
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ Connected to MongoDB Atlas (db="${mongoose.connection.name}")`);
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

module.exports = connectDB;
