require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocketHandler } = require('./sockets/socketHandler');
const { seedDatabaseIfEmpty } = require('./utils/seedData');

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const server = http.createServer(app);

// Initialize Socket.io with robust CORS configuration
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow local development and deployment URLs
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PATCH'],
    credentials: true
  },
  pingTimeout: 30000,
  pingInterval: 25000
});

// Attach socket event listeners
initSocketHandler(io);

// Server startup lifecycle
const startServer = async () => {
  try {
    // 1. Connect to Database (with in-memory fallback if local MongoDB is not running)
    await connectDB();

    // 2. Seed database with initial menu items and demo accounts if empty
    await seedDatabaseIfEmpty();

    // 3. Listen on PORT
    server.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 QuickBite Server Running on Port: ${PORT}`);
      console.log(`📡 WebSocket Engine Initialized`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
      console.log(`🌐 Allowed Client URL: ${CLIENT_URL}`);
      console.log(`=========================================`);
    });
  } catch (err) {
    console.error(`[Server Start Error]: ${err.message}`);
    process.exit(1);
  }
};

// Graceful shutdown handling
const handleGracefulShutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('[Server] HTTP and Socket server closed.');
    await disconnectDB();
    console.log('[Server] Database connection closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));

startServer();
