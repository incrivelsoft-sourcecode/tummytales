// scripts/seedQuestions.js
require('dotenv').config();
const mongoose   = require('mongoose');
const Questions  = require('../models/questions');
const seedData   = require('../data/questions.json');  // adjust if yours is elsewhere

async function seed() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser:    true,
    useUnifiedTopology: true
  });
  console.log('✅ Connected to MongoDB');

  await Questions.deleteMany({});
  console.log('🗑️  Cleared Questions collection');

  await Questions.insertMany(seedData);
  console.log(`✅ Inserted ${seedData.length} questions`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected');
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
