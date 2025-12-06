// Script to set emailVerified=true for all approved accounts
// This allows existing approved users to log in

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/s-core')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define User schema (minimal version)
const userSchema = new mongoose.Schema({
  fName: String,
  lName: String,
  email: String,
  username: String,
  status: String,
  emailVerified: Boolean
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function fixApprovedAccounts() {
  try {
    console.log('\n===== FIXING APPROVED ACCOUNTS =====\n');
    
    // Find all approved users with emailVerified=false
    const usersToFix = await User.find({ 
      status: 'approved',
      emailVerified: { $ne: true }
    });
    
    console.log(`Found ${usersToFix.length} approved accounts with unverified emails\n`);
    
    if (usersToFix.length === 0) {
      console.log('✅ All approved accounts already have verified emails!');
      mongoose.connection.close();
      return;
    }
    
    // Update all approved accounts
    const result = await User.updateMany(
      { 
        status: 'approved',
        emailVerified: { $ne: true }
      },
      { 
        $set: { emailVerified: true }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} accounts\n`);
    console.log('Updated accounts:');
    
    usersToFix.forEach(user => {
      console.log(`  - ${user.username} (${user.fName} ${user.lName}) - ${user.email}`);
    });
    
    console.log('\n===== DONE =====\n');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

fixApprovedAccounts();
