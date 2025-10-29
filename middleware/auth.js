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

    // User is authenticated and has admin privileges
    req.user = user; // Make user available to route handlers
    next();

  } catch (err) {
    console.error('Admin authentication error:', err);
    res.status(500).render('error', {
      message: 'Server error during authentication'
    });
  }
}

module.exports = {
  requireLogin,
  requireAdmin
};
