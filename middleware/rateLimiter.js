// ===== Rate Limiting Middleware =====
// Prevents abuse and brute force attacks on API endpoints

const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * Limits: 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user && req.user.role === 'admin';
  }
});

/**
 * Authentication rate limiter
 * Prevents brute force login attempts
 * Limits: 5 requests per 15 minutes per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { success: false, message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // Don't count successful requests
});

/**
 * Strict rate limiter for sensitive operations
 * Limits: 10 requests per hour per user
 */
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID instead of IP if authenticated
    return req.user ? req.user._id.toString() : req.ip;
  }
});

/**
 * Message/conversation rate limiter
 * Limits: 30 messages per 5 minutes per user
 */
const messageLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30,
  message: { success: false, message: 'You are sending messages too quickly' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID
    return req.user ? req.user._id.toString() : req.ip;
  },
  skip: (req) => {
    // Skip for admins
    return req.user && req.user.role === 'admin';
  }
});

/**
 * File upload rate limiter
 * Limits: 20 uploads per hour per user
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: { success: false, message: 'Too many uploads, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  }
});

/**
 * Request creation rate limiter
 * Limits: 10 new requests per hour per user
 */
const requestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { success: false, message: 'You have created too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  }
});

/**
 * Email sending rate limiter
 * Limits: 5 emails per hour per user
 */
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many emails sent, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user._id.toString() : req.ip;
  },
  skip: (req) => {
    // Skip for admins
    return req.user && req.user.role === 'admin';
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  strictLimiter,
  messageLimiter,
  uploadLimiter,
  requestLimiter,
  emailLimiter
};
