const mongoose = require('mongoose');
const BroadcastMessage = require('./models/BroadcastMessage');
const notificationService = require('./services/notificationService');
const User = require('./models/User');

async function testFutureAnnouncementFiltering() {
  try {
    const uri = process.env.MONGO_URI || 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Get admin user
    const admin = await User.findOne({ role: 'admin' }).lean();
    if (!admin) {
      console.log('❌ No admin user found');
      process.exit(1);
    }

    // Get test users
    const users = await User.find({ role: { $in: ['user', 'admin'] } }).select('_id fName lName role').lean();
    if (users.length === 0) {
      console.log('❌ No users found');
      process.exit(1);
    }

    console.log(`📋 Testing future announcement filtering\n`);
    console.log(`Found ${users.length} users\n`);

    // Create a future announcement (2 hours from now in UTC)
    const futureTime = new Date();
    futureTime.setHours(futureTime.getHours() + 2);

    const futureAnnouncement = new BroadcastMessage({
      title: '🔮 FUTURE TEST - Should NOT appear in notifications yet',
      content: 'This announcement is scheduled for 2 hours from now. It should NOT appear in user notifications.',
      priority: 'high',
      status: 'scheduled',
      scheduledTime: futureTime,
      sentBy: admin._id,
      recipients: users.map(u => ({ userId: u._id, isRead: false })),
    });

    await futureAnnouncement.save();
    console.log(`✅ Created future announcement`);
    console.log(`   ID: ${futureAnnouncement._id}`);
    console.log(`   Title: ${futureAnnouncement.title}`);
    console.log(`   Scheduled: ${futureTime.toISOString()}`);
    console.log(`   In ${Math.floor((futureTime - new Date()) / 1000 / 60)} minutes\n`);

    // Create notifications for all users (simulating what sendAnnouncement does)
    console.log('📧 Creating notifications for all users...');
    for (const user of users) {
      await notificationService.createNotification({
        recipient: user._id,
        title: `📢 ${futureAnnouncement.title}`,
        message: futureAnnouncement.content.substring(0, 200),
        type: 'announcement',
        priority: futureAnnouncement.priority,
        actionUrl: '/dashboard',
        relatedId: futureAnnouncement._id,
        relatedModel: 'BroadcastMessage'
      });
    }
    console.log(`✅ Notifications created for ${users.length} users\n`);

    // Test filtering for first user
    const testUser = users[0];
    console.log(`🔍 Checking notifications for: ${testUser.fName} ${testUser.lName}`);

    // Get ALL notifications (including future ones)
    const rawNotifications = await require('./models/Notification').find({ 
      recipient: testUser._id,
      type: 'announcement'
    }).lean();

    console.log(`   Raw announcement notifications (before filtering): ${rawNotifications.length}`);
    
    // Get filtered notifications (using API)
    const result = await notificationService.getUserNotifications(testUser._id, 1, 100, false);
    const filteredAnnouncements = result.notifications.filter(n => n.type === 'announcement');

    console.log(`   Filtered announcement notifications (after filtering): ${filteredAnnouncements.length}`);

    // Check if future announcement is in the filtered list
    const hasFutureAnnouncement = filteredAnnouncements.some(n => 
      n.relatedId && n.relatedId.toString() === futureAnnouncement._id.toString()
    );

    console.log(`\n${hasFutureAnnouncement ? '❌ FAIL' : '✅ PASS'}: Future announcement ${hasFutureAnnouncement ? 'IS' : 'is NOT'} showing in notifications`);
    
    if (!hasFutureAnnouncement) {
      console.log('   ✅ Correctly hidden from user notifications!');
    }

    // Now create a past announcement (1 hour ago in UTC) for comparison
    const pastTime = new Date();
    pastTime.setHours(pastTime.getHours() - 1);

    const pastAnnouncement = new BroadcastMessage({
      title: '📌 PAST TEST - Should appear in notifications',
      content: 'This announcement was scheduled 1 hour ago. It SHOULD appear in notifications.',
      priority: 'medium',
      status: 'active',
      scheduledTime: pastTime,
      sentBy: admin._id,
      recipients: users.map(u => ({ userId: u._id, isRead: false })),
    });

    await pastAnnouncement.save();
    console.log(`\n✅ Created past announcement`);
    console.log(`   ID: ${pastAnnouncement._id}`);
    console.log(`   Scheduled: ${pastTime.toISOString()}`);
    console.log(`   ${Math.floor((new Date() - pastTime) / 1000 / 60)} minutes ago\n`);

    // Create notifications for past announcement
    for (const user of users) {
      await notificationService.createNotification({
        recipient: user._id,
        title: `📢 ${pastAnnouncement.title}`,
        message: pastAnnouncement.content.substring(0, 200),
        type: 'announcement',
        priority: pastAnnouncement.priority,
        actionUrl: '/dashboard',
        relatedId: pastAnnouncement._id,
        relatedModel: 'BroadcastMessage'
      });
    }
    console.log(`✅ Notifications created for past announcement\n`);

    // Check filtering again
    const result2 = await notificationService.getUserNotifications(testUser._id, 1, 100, false);
    const filteredAnnouncements2 = result2.notifications.filter(n => n.type === 'announcement');

    const hasPastAnnouncement = filteredAnnouncements2.some(n => 
      n.relatedId && n.relatedId.toString() === pastAnnouncement._id.toString()
    );

    console.log(`${hasPastAnnouncement ? '✅ PASS' : '❌ FAIL'}: Past announcement ${hasPastAnnouncement ? 'IS' : 'is NOT'} showing in notifications`);

    if (hasPastAnnouncement) {
      console.log('   ✅ Correctly shown to user!');
    }

    console.log('\n✅ Filtering test completed');
    console.log(`\n📊 Summary:`);
    console.log(`   Future announcements shown: ${hasFutureAnnouncement ? 'YES ❌' : 'NO ✅'}`);
    console.log(`   Past announcements shown: ${hasPastAnnouncement ? 'YES ✅' : 'NO ❌'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testFutureAnnouncementFiltering();
