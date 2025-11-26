const mongoose = require('mongoose');
const BroadcastMessage = require('./models/BroadcastMessage');
const Notification = require('./models/Notification');
const User = require('./models/User');

async function testNotificationFilter() {
  try {
    // Connect to database
    const uri = process.env.MONGO_URI || 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB');

    // Get a test user
    const testUser = await User.findOne({ role: 'user' }).lean();
    if (!testUser) {
      console.log('❌ No test user found');
      process.exit(1);
    }

    console.log(`\n📋 Testing notification filter for user: ${testUser._id}`);
    console.log(`User: ${testUser.fName} ${testUser.lName}`);

    // Get all notifications for this user (unfiltered)
    const allNotifications = await Notification.find({ recipient: testUser._id })
      .lean();
    
    console.log(`\n📊 Total notifications in database: ${allNotifications.length}`);

    // Filter announcements
    const announcementNotifications = allNotifications.filter(n => n.type === 'announcement');
    console.log(`📢 Announcement notifications: ${announcementNotifications.length}`);

    if (announcementNotifications.length === 0) {
      console.log('No announcement notifications to test');
      process.exit(0);
    }

    // Check each announcement
    const now = new Date();
    console.log(`\nCurrent server time (UTC): ${now.toISOString()}`);
    console.log(`Current PHT time (UTC+8): ${new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString()}`);

    for (const notif of announcementNotifications) {
      const announcement = await BroadcastMessage.findById(notif.relatedId).lean();
      
      if (!announcement) {
        console.log(`\n⚠️  Notification ${notif._id} - Announcement deleted`);
        continue;
      }

      const scheduled = announcement.scheduledTime;
      const shouldShow = !scheduled || new Date(scheduled) <= now;
      const statusIcon = shouldShow ? '✅' : '❌';

      console.log(`\n${statusIcon} Notification: ${notif.title}`);
      console.log(`   Scheduled time: ${scheduled ? scheduled.toISOString() : 'No schedule'}`);
      console.log(`   Created: ${notif.createdAt.toISOString()}`);
      console.log(`   Should show: ${shouldShow}`);
      
      if (scheduled) {
        const diff = new Date(scheduled) - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diff > 0) {
          console.log(`   Time until scheduled: ${hours}h ${minutes}m`);
        } else {
          console.log(`   Time since scheduled: ${Math.abs(hours)}h ${Math.abs(minutes)}m ago`);
        }
      }
    }

    console.log('\n✅ Filter test completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testNotificationFilter();
