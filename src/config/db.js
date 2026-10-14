const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  // If in test environment, tests manage their own in-memory database connection
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quickbite_db';

  try {
    // Attempt standard connection with a 4-second timeout
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000
    });
    console.log(`[Database] MongoDB Connected successfully to: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`[Database] Could not connect to MongoDB URI (${err.message}).`);
    console.log('[Database] Initializing fallback in-memory database for local development...');

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const memUri = memoryServer.getUri();
      await mongoose.connect(memUri);
      console.log(`[Database] In-memory MongoDB Connected successfully: ${memUri}`);
    } catch (memErr) {
      console.error(`[Database] Failed to start fallback in-memory database: ${memErr.message}`);
      throw memErr;
    }
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
