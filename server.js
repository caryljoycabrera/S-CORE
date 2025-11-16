// ===== Main Application Server =====
// This is the entry point for the S-CORE application
// It imports all modules and sets up the Express server

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const http = require('http');

// Import configuration modules
const { connectDB } = require('./config/database');
const { upload, ensureUploadsDirectory, UPLOADS_DIR } = require('./config/upload');

// Import services
const socketService = require('./services/socketService');

// Create Express application and HTTP server
const app = express();
const server = http.createServer(app);
const port = 8080;

// ======= Database Connection =======
connectDB();

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
app.use(express.json({ limit: '10mb' }));
app.use(bodyParser.json());

// Session handling
app.use(session({
  secret: 's-core-secret',
  resave: false,
  saveUninitialized: false
}));

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

// Use route modules
app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', adminRoutes);
app.use('/', unitRoutes);
app.use('/', apiRoutes);
app.use('/', notificationRoutes);

// ======= Test Route for Status Integration ========
app.get('/test-status-integration', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'test-status-integration.html'));
});

// ======= Server Startup ========

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log('Socket.IO enabled for real-time notifications');
});

// ======= Modules for Route Use ========
module.exports = { app, server };
