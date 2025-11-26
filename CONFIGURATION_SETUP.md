# Homepage Configuration Feature - Setup Guide

## Overview
This feature allows administrators to edit homepage content through an intuitive admin interface. Content is stored in MongoDB with a JSON file fallback option.

## Files Created/Modified

### New Files Created:
1. **models/Page.js** - MongoDB model for storing page content
2. **views/Admin/configuration.ejs** - Admin configuration page UI
3. **data/homepage.json** - JSON fallback storage (created automatically)

### Modified Files:
1. **routes/admin.js** - Added GET and POST /admin/configuration routes
2. **routes/user.js** - Updated homepage route to load dynamic content
3. **views/homepage.ejs** - Updated to use dynamic content from database
4. **views/Admin/adminpage.ejs** - Added Configuration link to sidebar

## Installation Steps

### Step 1: No New Dependencies Required
All required npm packages are already installed:
- `mongoose` - Already in package.json
- `express` - Already in package.json
- `ejs` - Already in package.json

### Step 2: Database Setup (Primary Option)
The Page model will automatically create the necessary MongoDB collection on first use.

#### Initialize Default Homepage Content:
Run this script once to seed the database with default content:

```javascript
// scripts/seed-homepage.js
const mongoose = require('mongoose');
const Page = require('./models/Page');
require('dotenv').config();

const seedHomepage = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const existingPage = await Page.findOne({ slug: 'home' });
    
    if (!existingPage) {
      const homepage = new Page({
        slug: 'home',
        title: 'Homepage',
        content: {
          heroTitle: 'Empowering Communication, Building Connections',
          heroSubtitle: 'The Strategic Communications Office identifies the information needs of the different offices of the academic community and develops appropriate communication strategies to meet those needs.',
          pledgeCreativity: 'To bring out the best of the community through projects of high aesthetic quality',
          pledgeEfficiency: 'To operate resourcefully and accurately in upholding the image of the University',
          pledgeDedication: 'To commit ourselves in fulfilling the communication needs of the Institution',
          aboutMission: 'The Strategic Communications Office serves as the primary hub for institutional communication at De La Salle University-Dasmariñas.',
          aboutVision: 'Through innovative approaches and creative solutions, we produce high-quality institutional information materials.',
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
      console.log('✓ Homepage content seeded successfully');
    } else {
      console.log('Homepage content already exists');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding homepage:', error);
    process.exit(1);
  }
};

seedHomepage();
```

Run with: `node scripts/seed-homepage.js`

### Step 3: JSON Fallback Setup (Optional Backup)
The system automatically uses the JSON file at `/data/homepage.json` if the database is unavailable. The file has been created with default content.

The system will:
1. First try to load from MongoDB
2. If MongoDB fails, load from `/data/homepage.json`
3. If both fail, use hardcoded defaults in the template

## Usage Instructions

### For Administrators:

1. **Access the Configuration Page:**
   - Log in as an administrator
   - Click "Configuration" in the admin sidebar
   - Or navigate to `/admin/configuration`

2. **Edit Homepage Content:**
   - Fill in the form fields with your desired content
   - Use the character counters to stay within limits
   - Click "Preview Changes" to see how it will look
   - Click "Save Changes" to persist updates

3. **Content Sections Available:**
   - **Hero Section:** Main title and subtitle
   - **SCO Pledge:** Three core values (Creativity, Efficiency, Dedication)
   - **About Section:** Mission and vision statements
   - **Contact Information:** Email, phone, address, hours
   - **Social Media Links:** Facebook pages and YouTube channel

### Features:

- **Live Preview:** See changes before saving
- **Character Limits:** Automatic validation and counting
- **Required Field Validation:** Ensures critical fields are filled
- **Success/Error Messages:** Clear feedback after saving
- **Responsive Design:** Works on desktop and mobile
- **Dual Storage:** Saves to both MongoDB and JSON file for redundancy

## API Endpoints

### GET /admin/configuration
- **Access:** Admin only (requires `requireAdmin` middleware)
- **Returns:** Configuration page with current homepage content
- **Query Params:** 
  - `?success=message` - Display success message
  - `?error=message` - Display error message

### POST /admin/configuration
- **Access:** Admin only (requires `requireAdmin` middleware)
- **Body:** Form data with all homepage content fields
- **Action:** Saves content to MongoDB and JSON file
- **Redirect:** Back to configuration page with success/error message

## Database Schema

### Page Collection
```javascript
{
  slug: String (unique, indexed) // 'home'
  title: String // 'Homepage'
  content: {
    heroTitle: String,
    heroSubtitle: String,
    pledgeCreativity: String,
    pledgeEfficiency: String,
    pledgeDedication: String,
    aboutMission: String,
    aboutVision: String,
    contactEmail: String,
    contactPhone: String,
    contactAddress: String,
    contactHours: String,
    socialFacebookMain: String,
    socialFacebookSCO: String,
    socialYoutube: String
  },
  lastUpdated: Date,
  updatedBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## Troubleshooting

### Issue: Configuration page shows 404
**Solution:** Ensure the server has been restarted after adding the routes.

### Issue: Changes not appearing on homepage
**Solution:** 
1. Check if the content was saved (look for success message)
2. Clear browser cache
3. Verify MongoDB connection
4. Check console for errors

### Issue: Database connection error
**Solution:** The system will automatically fall back to `/data/homepage.json`. Check:
1. MongoDB connection string in `.env`
2. Database server is running
3. Network connectivity

### Issue: Permission denied when accessing configuration
**Solution:** Ensure you're logged in as an administrator (role: 'admin' in User model)

## Security Considerations

1. **Authentication Required:** Only administrators can access the configuration page
2. **Input Validation:** Character limits and required field validation
3. **XSS Protection:** EJS automatically escapes HTML in templates
4. **CSRF Protection:** Ensure your session middleware is properly configured

## Maintenance

### Backup Content:
Content is automatically backed up to `/data/homepage.json` on every save.

### Restore from Backup:
If needed, you can manually restore from the JSON file:
1. Ensure `/data/homepage.json` exists with valid content
2. Temporarily disable MongoDB or remove the database entry
3. The system will load from JSON automatically
4. Use the admin interface to save, which will restore to MongoDB

## Future Enhancements

Potential improvements you could add:
1. Content versioning/history
2. Preview in a modal that mimics the actual homepage
3. Image upload for hero section
4. Multi-language support
5. Schedule content changes
6. More granular permissions

## Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Verify all files are in the correct locations
3. Ensure database connection is working
4. Check that admin authentication middleware is functioning

---

**Last Updated:** November 26, 2025
**Version:** 1.0.0
