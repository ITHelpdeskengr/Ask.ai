const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot';

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('✅ MongoDB connected:', mongoose.connection.host);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️  Running without database. Some features may be limited.');
    // Don't exit — allow app to run with limited functionality
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('⚠️  MongoDB disconnected. Reconnecting...');
  setTimeout(connectDB, 5000);
});

module.exports = connectDB;
