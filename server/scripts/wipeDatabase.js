import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/database.js';

// Load env
dotenv.config();

(async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();

    console.log('🗑️ Dropping database...');
    await mongoose.connection.db.dropDatabase();

    console.log('✅ Database dropped successfully');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to drop database:', err);
    process.exit(1);
  }
})();
