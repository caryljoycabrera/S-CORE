// ===== Main Application Server =====
// This is the entry point for the S-CORE application
// It imports all modules and sets up the Express server

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const http = require('http');

// Load environment variables from .env file
require('dotenv').config();

// Import configuration modules
const { connectDB } = require('./config/database');
const { upload, ensureUploadsDirectory, UPLOADS_DIR } = require('./config/upload');
const { clerkMiddleware } = require('./config/clerk');

// Import middleware
const { apiLimiter, authLimiter, messageLimiter, requestLimiter } = require('./middleware/rateLimiter');
const { sanitizeAll } = require('./middleware/sanitize');

// Import services
const socketService = require('./services/socketService');
const settingsService = require('./services/settingsService');
const announcementService = require('./services/announcementService');
const cron = require('node-cron');

// Create Express application and HTTP server
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8080;

// ======= Database Connection =======
connectDB();

// ======= Initialize Server Async =======
(async () => {
  try {
    // Load system settings before starting server
    await settingsService.loadSettings();
    console.log('[SERVER] System settings loaded successfully');
  } catch (err) {
    console.error('[SERVER] Failed to load system settings:', err);
    console.error('[SERVER] Server will continue with default settings');
  }
})();

// ======= Socket.IO Initialization =======
socketService.initialize(server);

// ======= Uploads Directory Setup =======
ensureUploadsDirectory();

// ======= Middleware Configuration ========

// Static file serving
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, 'public')));

// Body parsers
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({ limit: process.env.MAX_FILE_SIZE || '50mb' }));

// ======= Security Middleware ========
// Apply sanitization middleware to all routes to prevent NoSQL injection
// This removes MongoDB operators ($) from request body, query, and params
app.use(sanitizeAll);

// Session handling with environment-based secret
app.use(session({
  secret: process.env.SESSION_SECRET || 's-core-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Clerk authentication middleware - adds auth object to all requests
app.use(clerkMiddleware());

// Make settings helpers available to all views
const settingsHelpers = require('./utils/settingsHelpers');
app.use((req, res, next) => {
  // Make settings helpers available in all views
  res.locals.settingsHelpers = settingsHelpers;
  res.locals.systemSettings = {
    organizations: settingsHelpers.getOrganizations(),
    offices: settingsHelpers.getOffices(),
    units: settingsHelpers.getUnits(),
    requestStatuses: settingsHelpers.getRequestStatuses(),
    siteConfig: settingsHelpers.getSiteConfig()
  };
  next();
});

// Logging middleware for API calls
app.use((req, res, next) => {
  // Log all unit-related routes
  if (req.path.startsWith('/unit')) {
    console.log('========================================');
    console.log('[SERVER] Unit route accessed:', req.method, req.path);
    console.log('[SERVER] Session ID:', req.session?.id);
    console.log('[SERVER] Session User ID:', req.session?.userId);
    console.log('========================================');
  }
  
  if (req.path === '/api/deadlines') {
    console.log('Deadlines API called by:', req.session.userId);
  }
  next();
});

// EJS view engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ======= Route Imports ========

// Import route modules
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const unitRoutes = require('./routes/unit');
const apiRoutes = require('./routes/api');
const notificationRoutes = require('./routes/notifications');
const messagesRoutes = require('./routes/messages');
const clerkRoutes = require('./routes/clerk');
// const adminCalendarRoutes = require('./routes/adminCalendar');

// Use route modules
app.use('/', authRoutes);
app.use('/', clerkRoutes);
console.log('[SERVER] Clerk routes registered');
app.use('/', userRoutes);
app.use('/', adminRoutes);
app.use('/', unitRoutes);
app.use('/', apiRoutes);
app.use('/', notificationRoutes);
app.use('/', messagesRoutes);
// app.use('/', adminCalendarRoutes);

// ======= Test Route for Status Integration ========
app.get('/test-status-integration', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'test-status-integration.html'));
});

// ======= Scheduled Jobs ========

// Schedule announcement processor to run every 5 minutes
const announcementSchedule = cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('[SCHEDULER] Processing scheduled announcements...');
    await announcementService.processScheduledAnnouncements();
    console.log('[SCHEDULER] Announcement processing completed');
  } catch (error) {
    console.error('[SCHEDULER] Error processing announcements:', error);
  }
}, {
  scheduled: true,
  timezone: process.env.TIMEZONE || 'UTC'
});

console.log('[SCHEDULER] Announcement scheduler initialized - runs every 5 minutes');

// ======= Server Startup ========

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Socket.IO enabled for real-time notifications');
  console.log('[SCHEDULER] All scheduled jobs are active');
});

// ======= Modules for Route Use ========
module.exports = { app, server };
