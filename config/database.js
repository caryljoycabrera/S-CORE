// ===== Database Configuration =====
// This module handles MongoDB connection setup and configuration

const mongoose = require('mongoose');

// Database connection URI - should be moved to environment variables in production
const uri = 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';

/**
 * Establishes connection to MongoDB database
 * Logs success/error messages to console
 */
const connectDB = async () => {
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log("MongoDB connected successfully");
    
    // Test the connection
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Log when we're connected
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected - ready for operations');
    });

  } catch (err) {
    console.error("MongoDB connection error:", err);
    console.log("Server will continue running without database connection...");
    // Don't exit - allow server to run without DB for frontend testing
    // process.exit(1); 
  }
};

/**
 * Closes the MongoDB database connection
 * Useful for testing or graceful shutdown
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log("MongoDB disconnected successfully");
  } catch (err) {
    console.error("MongoDB disconnection error:", err);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
