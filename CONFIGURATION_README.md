# Homepage Configuration - Quick Start

## 🚀 Quick Setup (3 Steps)

### 1. Seed the Database (First Time Only)
```bash
node scripts/seed-homepage.js
```

### 2. Restart the Server
```bash
npm start
# or
node server.js
```

### 3. Access the Configuration Page
1. Log in as an administrator
2. Go to **Admin Dashboard** → **Configuration** (in sidebar)
3. Or navigate directly to: `http://localhost:8080/admin/configuration`

---

## ✨ Features

- ✅ **Easy Content Management** - Edit all homepage sections from one page
- ✅ **Live Preview** - See changes before publishing
- ✅ **Auto-Save to Database** - Content stored in MongoDB
- ✅ **JSON Backup** - Automatic backup to `/data/homepage.json`
- ✅ **Character Limits** - Prevents overly long content
- ✅ **Validation** - Ensures required fields are filled
- ✅ **Mobile Responsive** - Works on all devices

---

## 📝 What You Can Edit

| Section | Fields | Description |
|---------|--------|-------------|
| **Hero** | Title, Subtitle | Main landing section |
| **Pledge** | Creativity, Efficiency, Dedication | SCO core values |
| **About** | Mission, Vision | Office description |
| **Contact** | Email, Phone, Address, Hours | Contact information |
| **Social** | Facebook, YouTube | Social media links |

---

## 🔐 Security

- Only **administrators** can access the configuration page
- Protected by `requireAdmin` middleware
- All inputs are validated and sanitized
- Session-based authentication required

---

## 📦 Storage Options

### Primary: MongoDB (Recommended)
- Fast and scalable
- Automatic backups
- Version tracking with timestamps

### Fallback: JSON File
- Location: `/data/homepage.json`
- Auto-created on first save
- Used if database is unavailable

---

## 🛠️ Troubleshooting

### Can't access configuration page?
- Ensure you're logged in as admin
- Check your user role in database
- Verify session is active

### Changes not showing?
- Hard refresh browser (Ctrl+F5)
- Check success message appeared
- Verify MongoDB connection

### Database connection failed?
- System automatically uses JSON fallback
- Check `.env` for `MONGO_URI`
- Verify network connectivity

---

## 📚 Full Documentation

See **CONFIGURATION_SETUP.md** for:
- Detailed setup instructions
- Database schema
- API endpoints
- Advanced troubleshooting
- Future enhancements

---

## 🎯 Common Tasks

### Update Homepage Content
```
1. Login as admin
2. Click "Configuration" in sidebar
3. Edit desired fields
4. Click "Preview Changes" (optional)
5. Click "Save Changes"
```

### Backup Current Content
Content is automatically saved to both:
- MongoDB: `pages` collection
- JSON: `/data/homepage.json`

### Restore from Backup
The JSON file serves as automatic backup.
If MongoDB fails, system loads from JSON.

---

**Need Help?** Check console logs for detailed error messages.

**Last Updated:** November 26, 2025
