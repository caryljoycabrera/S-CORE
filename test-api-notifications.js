const mongoose = require('mongoose');
const notificationService = require('./services/notificationService');
const User = require('./models/User');

async function testUserNotificationsAPI() {
  try {
    // Connect to database
    const uri = process.env.MONGO_URI || 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Get a test user
    const testUser = await User.findOne({ role: 'user' }).lean();
    if (!testUser) {
      console.log('❌ No test user found');
      process.exit(1);
    }

    console.log(`📋 Testing getUserNotifications API for user: ${testUser._id}`);
    console.log(`User: ${testUser.fName} ${testUser.lName}\n`);

    // Call the API
    const result = await notificationService.getUserNotifications(testUser._id, 1, 20, false);

    console.log('📊 Results from getUserNotifications:');
    console.log(`   Total filtered notifications: ${result.totalCount}`);
    console.log(`   Unread count: ${result.unreadCount}`);
    console.log(`   Current page: ${result.currentPage}`);
    console.log(`   Total pages: ${result.totalPages}`);
    console.log(`   Notifications in this page: ${result.notifications.length}`);

    if (result.notifications.length > 0) {
      console.log('\n📢 Announcement notifications shown:');
      const announcements = result.notifications.filter(n => n.type === 'announcement');
      if (announcements.length === 0) {
        console.log('   (None)');
      } else {
        for (const notif of announcements) {
          console.log(`   - ${notif.title}`);
          console.log(`     Created: ${new Date(notif.createdAt).toISOString()}`);
          console.log(`     Read: ${notif.isRead ? 'Yes' : 'No'}`);
        }
      }
    }

    console.log('\n✅ API test completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testUserNotificationsAPI();
