// ===== Add About Features to Homepage =====
// Run this script to add the hardcoded about features to the existing homepage content
// Usage: node scripts/add-about-features.js

const mongoose = require('mongoose');
const Page = require('../models/Page');
require('dotenv').config();

const addAboutFeatures = async () => {
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

    // Add the hardcoded features
    homepage.content.aboutFeatures = [
      {
        icon: '📱',
        title: 'Digital Excellence',
        description: 'Leveraging cutting-edge digital platforms for maximum reach and engagement'
      },
      {
        icon: '🎨',
        title: 'Creative Design',
        description: 'Producing visually stunning materials that reflect our institution\'s prestige'
      },
      {
        icon: '📊',
        title: 'Strategic Planning',
        description: 'Data-driven communication strategies for measurable impact'
      },
      {
        icon: '🤝',
        title: 'Community Focus',
        description: 'Building stronger connections within our academic community'
      }
    ];

    await homepage.save();
    console.log('[UPDATE] ✓ About features added successfully!');
    console.log('[UPDATE] Features added:', homepage.content.aboutFeatures.length);

    await mongoose.disconnect();
    console.log('[UPDATE] Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('[UPDATE] Error adding about features:', error);
    console.error('[UPDATE] Full error:', error.stack);
    process.exit(1);
  }
};

// Run the update function
addAboutFeatures();