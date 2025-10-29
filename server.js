// ===== Main Application Server =====
// This is the entry point for the S-CORE application
// It imports all modules and sets up the Express server

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

// Import configuration modules
const { connectDB } = require('./config/database');
const { upload, ensureUploadsDirectory, UPLOADS_DIR } = require('./config/upload');

// Create Express application
const app = express();
const port = 8080;

// ======= Database Connection =======
connectDB();

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
const apiRoutes = require('./routes/api');

// Use route modules
app.use('/', authRoutes);
app.use('/', userRoutes);
app.use('/', adminRoutes);
app.use('/', apiRoutes);

// ======= Server Startup ========

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// ======= Modules for Route Use ========
module.exports = app;
