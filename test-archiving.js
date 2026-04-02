// ===== Quick Archiving Test Script =====
// Run this with: node test-archiving.js
// It calls runArchivingTasks() directly (bypasses the HTTP/session layer)

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const { runArchivingTasks } = require('./services/archivingService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/';

(async () => {
  try {
    console.log('[TEST] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[TEST] Connected! Running archiving tasks...\n');

    const result = await runArchivingTasks();

    console.log('\n[TEST] ✅ Done!');
    console.log(`[TEST] Total archived this run: ${result.totalArchived}`);

    if (result.totalArchived === 0) {
      console.log('[TEST] No requests were archived.');
      console.log('[TEST] This means either:');
      console.log('       → There are no Completed/Approved/For Revision requests old enough');
      console.log('       → Try lowering the day limits in Admin → Configuration first');
    }

  } catch (err) {
    console.error('[TEST] ❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('[TEST] Disconnected from MongoDB.');
    process.exit(0);
  }
})();
