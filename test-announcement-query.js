// Quick test to verify announcement query logic
const mongoose = require('mongoose');
require('dotenv').config();

const { connectDB } = require('./config/database');
const BroadcastMessage = require('./models/BroadcastMessage');

async function testQuery() {
  try {
    await connectDB();
    console.log('Connected to DB');

    const now = new Date();
    console.log('\n=== TEST ANNOUNCEMENT QUERY ===');
    console.log('Current server time (UTC):', now.toISOString());

    // Get all announcements
    const all = await BroadcastMessage.find({}).lean();
    console.log('\nTotal announcements in DB:', all.length);

    all.forEach(a => {
      console.log('\nAnnouncement:', a.title);
      console.log('  scheduledTime:', a.scheduledTime);
      console.log('  isVisibleToAll:', a.isVisibleToAll);
      if (a.scheduledTime) {
        const scheduledDate = new Date(a.scheduledTime);
        console.log('  scheduledTime as ISO:', scheduledDate.toISOString());
        console.log('  scheduledTime <= now?', scheduledDate <= now);
      } else {
        console.log('  No scheduledTime (should be visible immediately)');
      }
    });

    // Test the actual query
    console.log('\n=== TESTING ACTUAL QUERY ===');
    const testUserId = '691dfcacd46d6473d31c2287'; // Example user ID
    
    const results = await BroadcastMessage.find({
      $and: [
        {
          $or: [
            { expiresAt: { $gte: now } },
            { expiresAt: { $exists: false } },
            { expiresAt: null }
          ]
        },
        {
          $or: [
            { isVisibleToAll: true },
            { 'recipients.userId': testUserId }
          ]
        },
        {
          $or: [
            { scheduledTime: { $exists: false } },
            { scheduledTime: null },
            { scheduledTime: { $lte: now } }
          ]
        }
      ]
    }).lean();

    console.log('\nAnnouncements that should be visible:', results.length);
    results.forEach(r => {
      console.log('  -', r.title, '(scheduledTime:', r.scheduledTime, ')');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testQuery();
