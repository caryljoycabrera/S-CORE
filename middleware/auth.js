// ===== Authentication Middleware =====
// This module provides middleware functions for user authentication and authorization
// Controls access to protected routes based on login status and user roles

/**
 * requireLogin Middleware
 * Ensures user is authenticated before accessing protected routes
 * Redirects to homepage if session is invalid or missing
 */
function requireLogin(req, res, next) {
  // Check if user has a valid session
  if (!req.session?.userId) {
    return res.redirect('/');
  }

  // User is authenticated, proceed to next middleware/route
  next();
}

/**
 * requireAuth Middleware
 * Ensures user is authenticated and populates req.user
 * Similar to requireLogin but also fetches user data
 */
async function requireAuth(req, res, next) {
  try {
    // Check if user has a valid session
    if (!req.session?.userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Fetch user from database
    const User = require('../models/User');
    const user = await User.findById(req.session.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Make user available to route handlers
    req.user = user;
    next();

  } catch (err) {
    console.error('Authentication error:', err);
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
}

/**
 * requireAdmin Middleware
 * Ensures user is both authenticated AND has admin privileges
 * Used for admin-only routes and operations
 */
async function requireAdmin(req, res, next) {
  try {
    // First check if user is logged in
    if (!req.session?.userId) {
      return res.redirect('/');
    }

    // Fetch user from database to verify admin status
    const User = require('../models/User');
    const user = await User.findById(req.session.userId);

    // Check if user exists and has admin role
    if (!user || user.role !== 'admin') {
      return res.status(403).render('error', {
        message: 'Access denied. Admins only.'
      });
    }

    // Check if user's email is verified
    if (!user.emailVerified) {
      return res.status(403).render('error', {
        message: 'Please verify your email address before accessing the system.'
      });
    }

    // Check if user is approved
    if (user.status !== 'approved') {
      return res.status(403).render('error', {
        message: 'Your account is pending admin approval. Please wait for verification.'
      });
    }

    // User is authenticated and has admin privileges
    req.user = user; // Make user available to route handlers
    next();

  } catch (err) {
    console.error('Admin authentication error:', err);
    return res.status(500).render('error', {
      message: 'Server error during authentication'
    });
  }
}

/**
 * requireUnit Middleware
 * Ensures user is both authenticated AND has unit member privileges
 * Used for unit-only routes and operations
 */
async function requireUnit(req, res, next) {
  try {
    console.log('[requireUnit] Starting unit authentication check');
    console.log('[requireUnit] Request path:', req.path);
    console.log('[requireUnit] Session userId:', req.session?.userId);
    
    // First check if user is logged in
    if (!req.session?.userId) {
      console.log('[requireUnit] ERROR: No session userId found - redirecting to /');
      return res.redirect('/');
    }

    // Fetch user from database to verify unit status
    const User = require('../models/User');
    console.log('[requireUnit] Fetching user from database...');
    const user = await User.findById(req.session.userId);

    if (!user) {
      console.log('[requireUnit] ERROR: User not found in database');
      return res.status(403).render('error', {
        message: 'Access denied. User not found.'
      });
    }

    console.log('[requireUnit] User found:', {
      id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
      unitTeam: user.unitTeam
    });

    // Check if user exists and has unit role
    if (user.role !== 'unit') {
      console.log('[requireUnit] ERROR: User does not have unit role. Role is:', user.role);
      return res.status(403).render('error', {
        message: 'Access denied. Unit members only.'
      });
    }

    // Check if user's email is verified
    if (!user.emailVerified) {
      console.log('[requireUnit] ERROR: User email not verified');
      return res.status(403).render('error', {
        message: 'Please verify your email address before accessing the system.'
      });
    }

    // Check if user is approved
    if (user.status !== 'approved') {
      console.log('[requireUnit] ERROR: User status is not approved. Status is:', user.status);
      return res.status(403).render('error', {
        message: 'Your account is pending approval. Please wait for an admin to verify your account.'
      });
    }

    console.log('[requireUnit] Authentication successful - proceeding to route handler');
    // User is authenticated and has unit privileges
    req.user = user; // Make user available to route handlers
    next();

  } catch (err) {
    console.error('[requireUnit] EXCEPTION during authentication:', err);
    console.error('[requireUnit] Stack trace:', err.stack);
    return res.status(500).render('error', {
      message: 'Server error during authentication'
    });
  }
}

/**
 * requireAdminAPI Middleware
 * Ensures user is both authenticated AND has admin privileges for API routes
 * Returns JSON responses instead of HTML for API endpoints
 */
async function requireAdminAPI(req, res, next) {
  try {
    // Get Clerk auth - note: req.auth is now async
    const auth = await req.auth?.();
    
    // Debug: log session and Clerk auth info
    console.log('[requireAdminAPI] Session ID:', req.session?.id);
    console.log('[requireAdminAPI] Session userId:', req.session?.userId);
    console.log('[requireAdminAPI] Clerk auth:', {
      userId: auth?.userId,
      sessionId: auth?.sessionId
    });
    console.log('[requireAdminAPI] Session keys:', Object.keys(req.session || {}));
    
    // Check session first, fall back to Clerk
    let userId = req.session?.userId || auth?.userId;
    
    if (!userId) {
      console.log('[requireAdminAPI] BLOCKED: No userId in session or Clerk auth');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Fetch user from database to verify admin status
    const User = require('../models/User');
    let user;
    
    // If userId from session (MongoDB _id format), find by _id
    // If userId from Clerk, find by clerkId
    if (req.session?.userId) {
      user = await User.findById(userId);
      console.log('[requireAdminAPI] Found user by session ID');
    } else if (auth?.userId) {
      user = await User.findOne({ clerkId: auth.userId });
      console.log('[requireAdminAPI] Found user by Clerk ID:', auth.userId);
    }

    // Check if user exists and has admin role
    if (!user || user.role !== 'admin') {
      console.log('[requireAdminAPI] Access denied: user not found or not admin');
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // User is authenticated and has admin privileges
    req.user = user; // Make user available to route handlers
    next();

  } catch (err) {
    console.error('Admin API authentication error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
}

module.exports = {
  requireLogin,
  requireAuth,
  requireAdmin,
  requireAdminAPI,
  requireUnit
};
