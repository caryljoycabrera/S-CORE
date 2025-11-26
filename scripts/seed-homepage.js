// ===== Homepage Content Seed Script =====
// Run this script to initialize the homepage content in MongoDB
// Usage: node scripts/seed-homepage.js

const mongoose = require('mongoose');
const Page = require('../models/Page');
require('dotenv').config();

const seedHomepage = async () => {
  try {
    console.log('[SEED] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://scoadmin:JoJiCa52425@cluster0.18ajqou.mongodb.net/');
    console.log('[SEED] Connected successfully');
    
    // Check if homepage content already exists
    const existingPage = await Page.findOne({ slug: 'home' });
    
    if (existingPage) {
      console.log('[SEED] Homepage content already exists in database');
      console.log('[SEED] Current title:', existingPage.title);
      console.log('[SEED] Last updated:', existingPage.lastUpdated);
      console.log('[SEED] Skipping seed - use admin interface to update');
      await mongoose.disconnect();
      return;
    }
    
    // Create new homepage content
    console.log('[SEED] Creating homepage content...');
    const homepage = new Page({
      slug: 'home',
      title: 'Homepage',
      content: {
        heroTitle: 'Empowering Communication, Building Connections',
        heroSubtitle: 'The Strategic Communications Office identifies the information needs of the different offices of the academic community and develops appropriate communication strategies to meet those needs. It produces institutional information materials, establishes linkages with the mass media and formulates marketing strategies that create an accurate image of the University.',
        pledgeCreativity: 'To bring out the best of the community through projects of high aesthetic quality',
        pledgeEfficiency: 'To operate resourcefully and accurately in upholding the image of the University',
        pledgeDedication: 'To commit ourselves in fulfilling the communication needs of the Institution',
        aboutMission: 'The Strategic Communications Office serves as the primary hub for institutional communication at De La Salle University-Dasmariñas. We identify the diverse information needs of different offices within our academic community and develop comprehensive communication strategies to meet those needs effectively.',
        aboutVision: 'Through innovative approaches and creative solutions, we produce high-quality institutional information materials, establish meaningful linkages with mass media, and formulate strategic marketing initiatives that accurately represent our University\'s values and achievements.',
        contactEmail: 'sco@dlsud.edu.ph',
        contactPhone: '(046) 481-1900 local 3031',
        contactAddress: '2nd Floor, Ayuntamiento De Gonzalez Building\nDLSU-Dasmariñas, Cavite',
        contactHours: 'Monday - Friday: 8:00 AM - 5:00 PM',
        socialFacebookMain: 'https://facebook.com/DLSU.Dasmarinas',
        socialFacebookSCO: 'https://facebook.com/dlsudsco',
        socialYoutube: 'https://youtube.com/@DLSUDasmaOfficial'
      }
    });
    
    await homepage.save();
    console.log('[SEED] ✓ Homepage content seeded successfully!');
    console.log('[SEED] Content ID:', homepage._id);
    console.log('[SEED] You can now edit this content at /admin/configuration');
    
    await mongoose.disconnect();
    console.log('[SEED] Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('[SEED] Error seeding homepage:', error);
    console.error('[SEED] Full error:', error.stack);
    process.exit(1);
  }
};

// Run the seed function
seedHomepage();
