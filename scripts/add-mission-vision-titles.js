// ===== Add Mission and Vision Titles to Homepage =====
// Run this script to add the mission and vision title fields to the existing homepage content
// Usage: node scripts/add-mission-vision-titles.js

const mongoose = require('mongoose');
const Page = require('../models/Page');
require('dotenv').config();

const addMissionVisionTitles = async () => {
  try {
    console.log('[UPDATE] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/');
    console.log('[UPDATE] Connected successfully');

    // Find the homepage content
    const homepage = await Page.findOne({ slug: 'home' });

    if (!homepage) {
      console.log('[UPDATE] Homepage content not found. Run seed-homepage.js first.');
      await mongoose.disconnect();
      return;
    }

    // Add the mission and vision titles
    homepage.content.aboutMissionTitle = 'Our Mission';
    homepage.content.aboutVisionTitle = 'Our Vision';

    await homepage.save();
    console.log('[UPDATE] ✓ Mission and Vision titles added successfully!');
    console.log('[UPDATE] Mission Title:', homepage.content.aboutMissionTitle);
    console.log('[UPDATE] Vision Title:', homepage.content.aboutVisionTitle);

    await mongoose.disconnect();
    console.log('[UPDATE] Database connection closed');

  } catch (error) {
    console.error('[UPDATE] Error updating homepage:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the update
addMissionVisionTitles();