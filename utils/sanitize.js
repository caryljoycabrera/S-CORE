// ===== Input Sanitization Utilities =====
// This module provides security functions to protect against injection attacks
// Includes NoSQL injection prevention, XSS protection, and input validation

/**
 * Escapes special regex characters in a string
 * Prevents regex injection attacks in MongoDB $regex queries
 *
 * @param {string} str - The string to escape
 * @returns {string} Escaped string safe for use in regex
 *
 * @example
 * escapeRegex('user.*') // returns 'user\\.\\*'
 */
function escapeRegex(str) {
  if (typeof str !== 'string') {
    return '';
  }
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitizes an object to prevent NoSQL injection
 * Removes MongoDB operators ($) from object keys
 *
 * @param {any} obj - The object to sanitize
 * @returns {any} Sanitized object
 *
 * @example
 * sanitizeObject({ $ne: 1 }) // returns { ne: 1 }
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Remove keys that start with $ (MongoDB operators)
      const sanitizedKey = key.startsWith('$') ? key.substring(1) : key;
      sanitized[sanitizedKey] = sanitizeObject(obj[key]);
    }
  }
  return sanitized;
}

/**
 * Sanitizes a string for safe use in database queries
 * Removes or escapes potentially dangerous characters
 *
 * @param {string} str - The string to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }

  // Remove null bytes
  str = str.replace(/\0/g, '');
  
  // Trim whitespace
  str = str.trim();

  return str;
}

/**
 * Sanitizes user input for HTML output (XSS prevention)
 * Escapes HTML special characters
 *
 * @param {string} str - The string to escape
 * @returns {string} HTML-safe string
 */
function escapeHtml(str) {
  if (typeof str !== 'string') {
    return '';
  }

  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  return str.replace(/[&<>"'`=/]/g, char => htmlEscapes[char]);
}

/**
 * Validates and sanitizes email format
 *
 * @param {string} email - The email to validate
 * @returns {string|null} Sanitized email or null if invalid
 */
function sanitizeEmail(email) {
  if (typeof email !== 'string') {
    return null;
  }

  email = email.toLowerCase().trim();
  
  // Basic email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return null;
  }

  // Remove any potentially dangerous characters
  email = email.replace(/[<>'"]/g, '');

  return email;
}

/**
 * Validates and sanitizes username
 *
 * @param {string} username - The username to validate
 * @returns {string|null} Sanitized username or null if invalid
 */
function sanitizeUsername(username) {
  if (typeof username !== 'string') {
    return null;
  }

  username = username.trim();

  // Allow only alphanumeric characters, underscores, and hyphens
  // Remove any other characters
  username = username.replace(/[^a-zA-Z0-9_-]/g, '');

  if (username.length < 3 || username.length > 50) {
    return null;
  }

  return username;
}

/**
 * Sanitizes a name field (first name, last name, etc.)
 *
 * @param {string} name - The name to sanitize
 * @returns {string} Sanitized name
 */
function sanitizeName(name) {
  if (typeof name !== 'string') {
    return '';
  }

  name = name.trim();

  // Allow only letters, spaces, hyphens, apostrophes, and periods
  name = name.replace(/[^a-zA-ZÀ-ÿ\s\-'.]/g, '');

  // Limit length
  if (name.length > 100) {
    name = name.substring(0, 100);
  }

  return name;
}

/**
 * Sanitizes phone number
 *
 * @param {string} phone - The phone number to sanitize
 * @returns {string} Sanitized phone number (digits only)
 */
function sanitizePhone(phone) {
  if (typeof phone !== 'string') {
    return '';
  }

  // Keep only digits and common phone characters
  return phone.replace(/[^0-9+\-() ]/g, '').trim();
}

/**
 * Sanitizes a MongoDB ObjectId string
 *
 * @param {string} id - The ID to validate
 * @returns {string|null} Valid ObjectId string or null
 */
function sanitizeMongoId(id) {
  if (typeof id !== 'string') {
    return null;
  }

  id = id.trim();

  // MongoDB ObjectId is 24 hex characters
  const objectIdRegex = /^[a-fA-F0-9]{24}$/;
  if (!objectIdRegex.test(id)) {
    return null;
  }

  return id;
}

/**
 * Sanitizes general text content
 * Removes potentially dangerous patterns while preserving readability
 *
 * @param {string} text - The text to sanitize
 * @param {number} maxLength - Maximum allowed length (default: 5000)
 * @returns {string} Sanitized text
 */
function sanitizeText(text, maxLength = 5000) {
  if (typeof text !== 'string') {
    return '';
  }

  // Remove null bytes
  text = text.replace(/\0/g, '');
  
  // Trim whitespace
  text = text.trim();

  // Limit length
  if (text.length > maxLength) {
    text = text.substring(0, maxLength);
  }

  return text;
}

/**
 * Sanitizes an array of strings
 *
 * @param {Array} arr - The array to sanitize
 * @param {Function} sanitizer - The sanitization function to apply to each element
 * @returns {Array} Sanitized array
 */
function sanitizeArray(arr, sanitizer = sanitizeString) {
  if (!Array.isArray(arr)) {
    return [];
  }

  return arr
    .map(item => sanitizer(item))
    .filter(item => item !== null && item !== '');
}

/**
 * Validates that a value is one of allowed options (enum validation)
 *
 * @param {string} value - The value to check
 * @param {Array} allowedValues - Array of allowed values
 * @param {string} defaultValue - Default value if validation fails
 * @returns {string} Valid value or default
 */
function validateEnum(value, allowedValues, defaultValue = null) {
  if (typeof value !== 'string') {
    return defaultValue;
  }

  value = value.trim();

  if (allowedValues.includes(value)) {
    return value;
  }

  return defaultValue;
}

/**
 * Sanitizes request body for common form submissions
 * Applies appropriate sanitization to common field types
 *
 * @param {Object} body - The request body to sanitize
 * @returns {Object} Sanitized request body
 */
function sanitizeRequestBody(body) {
  if (typeof body !== 'object' || body === null) {
    return {};
  }

  const sanitized = {};

  for (const key in body) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      const value = body[key];

      // Skip if value is undefined
      if (value === undefined) {
        continue;
      }

      // Handle arrays
      if (Array.isArray(value)) {
        sanitized[key] = sanitizeArray(value);
        continue;
      }

      // Handle strings based on common field names
      if (typeof value === 'string') {
        const lowerKey = key.toLowerCase();

        if (lowerKey.includes('email')) {
          sanitized[key] = sanitizeEmail(value) || '';
        } else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
          sanitized[key] = sanitizePhone(value);
        } else if (lowerKey.includes('name') && !lowerKey.includes('username')) {
          sanitized[key] = sanitizeName(value);
        } else if (lowerKey === 'username') {
          sanitized[key] = value.trim(); // Keep original for username validation
        } else if (lowerKey === 'password' || lowerKey === 'confirmpassword') {
          sanitized[key] = value; // Don't modify passwords
        } else if (lowerKey.includes('id') && lowerKey !== 'studentid') {
          // Check if it looks like a MongoDB ID
          if (/^[a-fA-F0-9]{24}$/.test(value.trim())) {
            sanitized[key] = sanitizeMongoId(value);
          } else {
            sanitized[key] = sanitizeString(value);
          }
        } else {
          sanitized[key] = sanitizeText(value);
        }
        continue;
      }

      // Handle other types
      sanitized[key] = value;
    }
  }

  return sanitized;
}

module.exports = {
  escapeRegex,
  sanitizeObject,
  sanitizeString,
  escapeHtml,
  sanitizeEmail,
  sanitizeUsername,
  sanitizeName,
  sanitizePhone,
  sanitizeMongoId,
  sanitizeText,
  sanitizeArray,
  validateEnum,
  sanitizeRequestBody
};
