require('dotenv').config();
const mongoose  = require('mongoose');
const Questions = require('../models/questions');
const seedData  = require('../data/questions.json'); // make sure path is correct

async function seed() {
  const uri = process.env.MONGO_URI;
  const db  = process.env.MONGO_DBNAME || 'tummytales-dev';

  await mongoose.connect(uri, {
    dbName: db,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });
  console.log('✅ Connected to MongoDB');
  console.log('Using database:', mongoose.connection.name);

  // Option 1: wipe & insert (requires remove privilege)
  await Questions.deleteMany({});
  console.log('🗑️  Cleared mental_health_agent_questions');

  await Questions.insertMany(seedData, { ordered: true });
  console.log(`✅ Inserted ${seedData.length} questions into mental_health_agent_questions`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected');
}

seed().catch(err => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
