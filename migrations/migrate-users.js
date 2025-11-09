const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB connection string - adjust as needed
const mongoURI = 'mongodb://localhost:27017/score';

async function migrateUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Update all existing users
        const result = await User.updateMany(
            { status: { $exists: false } },
            { $set: { status: 'approved' } }
        );

        console.log(`Updated ${result.modifiedCount} users to approved status`);

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run migration
migrateUsers();