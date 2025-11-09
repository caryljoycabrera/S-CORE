// ===== User Status Migration Script =====
// This script updates all existing users to have 'approved' status
// Run this ONCE after adding the status field to the User model
// New users will automatically get 'pending' status from the model default

const mongoose = require('mongoose');
const User = require('./models/User');

// MongoDB connection string - using the same connection as your app
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';

async function migrateUserStatus() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Checking current user statuses...');
    
    // Count users without status or with pending/denied status
    const usersNeedingUpdate = await User.countDocuments({
      $or: [
        { status: { $exists: false } },
        { status: null },
        { status: 'pending' },
        { status: 'denied' }
      ]
    });

    console.log(`Found ${usersNeedingUpdate} users that need status update`);

    if (usersNeedingUpdate === 0) {
      console.log('✅ All users already have approved status!');
      await mongoose.connection.close();
      return;
    }

    console.log('\n🔄 Updating all existing users to "approved" status...');
    
    // Update all users without proper status to 'approved'
    const result = await User.updateMany(
      {
        $or: [
          { status: { $exists: false } },
          { status: null },
          { status: 'pending' },
          { status: 'denied' }
        ]
      },
      {
        $set: { status: 'approved' }
      }
    );

    console.log(`\n✅ Migration complete!`);
    console.log(`   - Users updated: ${result.modifiedCount}`);
    console.log(`   - Users matched: ${result.matchedCount}`);
    
    // Verify the update
    console.log('\n🔍 Verifying migration...');
    const approvedCount = await User.countDocuments({ status: 'approved' });
    const pendingCount = await User.countDocuments({ status: 'pending' });
    const deniedCount = await User.countDocuments({ status: 'denied' });
    const noStatusCount = await User.countDocuments({ status: { $exists: false } });
    
    console.log(`   - Approved users: ${approvedCount}`);
    console.log(`   - Pending users: ${pendingCount}`);
    console.log(`   - Denied users: ${deniedCount}`);
    console.log(`   - Users without status: ${noStatusCount}`);
    
    console.log('\n✨ All existing users can now login!');
    console.log('📝 New users will automatically get "pending" status and require admin approval.');

    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
console.log('🚀 Starting User Status Migration...\n');
migrateUserStatus();
