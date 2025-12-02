// ===== Input Sanitization Middleware =====
// This middleware provides automatic sanitization of incoming request data
// Helps protect against NoSQL injection and other input-based attacks

const { sanitizeObject } = require('../utils/sanitize');

/**
 * Middleware to sanitize request body
 * Removes MongoDB operators from request body to prevent NoSQL injection
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    // Deep sanitize the request body to remove MongoDB operators
    req.body = sanitizeRequestBody(req.body);
  }
  next();
}

/**
 * Sanitize request body by removing MongoDB operators from keys
 * This prevents NoSQL injection attacks through request body manipulation
 * 
 * @param {Object} obj - The object to sanitize
 * @returns {Object} Sanitized object
 */
function sanitizeRequestBody(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeRequestBody(item));
  }

  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Check if key starts with $ (MongoDB operator)
      if (key.startsWith('$')) {
        // Log potential injection attempt
        console.warn(`[SECURITY] Potential NoSQL injection attempt detected: key "${key}" removed from request body`);
        continue; // Skip this key entirely
      }
      
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeRequestBody(obj[key]);
    }
  }
  return sanitized;
}

/**
 * Middleware to sanitize query parameters
 * Removes MongoDB operators from query strings
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function sanitizeQuery(req, res, next) {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeRequestBody(req.query);
  }
  next();
}

/**
 * Middleware to sanitize route parameters
 * Validates that IDs in params are valid MongoDB ObjectIds
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function sanitizeParams(req, res, next) {
  if (req.params && typeof req.params === 'object') {
    for (const key in req.params) {
      if (Object.prototype.hasOwnProperty.call(req.params, key)) {
        const value = req.params[key];
        
        // Check if this looks like an ID parameter
        if (key.toLowerCase().includes('id') && typeof value === 'string') {
          // Validate MongoDB ObjectId format (24 hex characters)
          if (value.length > 0 && !/^[a-fA-F0-9]{24}$/.test(value)) {
            // Only warn for values that look like they should be ObjectIds
            if (value.length === 24 || key === 'id' || key.endsWith('Id')) {
              console.warn(`[SECURITY] Invalid ObjectId format in params: ${key}="${value}"`);
            }
          }
        }
        
        // Remove any MongoDB operators
        if (value.startsWith && value.startsWith('$')) {
          console.warn(`[SECURITY] Potential injection in params: ${key}="${value}"`);
          req.params[key] = '';
        }
      }
    }
  }
  next();
}

/**
 * Combined sanitization middleware
 * Applies body, query, and params sanitization in one middleware
 */
function sanitizeAll(req, res, next) {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeRequestBody(req.body);
  }
  
  // Sanitize query
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeRequestBody(req.query);
  }
  
  // Sanitize params (light validation)
  if (req.params && typeof req.params === 'object') {
    for (const key in req.params) {
      if (Object.prototype.hasOwnProperty.call(req.params, key)) {
        const value = req.params[key];
        if (typeof value === 'string' && value.startsWith('$')) {
          req.params[key] = '';
        }
      }
    }
  }
  
  next();
}

module.exports = {
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeAll,
  sanitizeRequestBody
};
