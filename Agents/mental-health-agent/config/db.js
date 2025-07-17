// config/db.js
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://vk319:vinay123@cluster0.tkygegl.mongodb.net/questionnaireDB?retryWrites=true&w=majority";

async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'questionnaireDB', // This will keep all collections grouped.
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

module.exports = connectDB;
