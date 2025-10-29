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
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process on connection failure
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
