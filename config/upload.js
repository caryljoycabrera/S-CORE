// ===== File Upload Configuration =====
// This module handles file upload setup using multer middleware

const path = require('path');
const multer = require('multer');
const fs = require('fs');
const settingsService = require('../services/settingsService');

// Define project root and uploads directory
const PROJECT_ROOT = path.resolve(__dirname, '..');
const UPLOADS_DIR = path.join(PROJECT_ROOT, 'uploads');

/**
 * Creates uploads directory if it doesn't exist
 * Logs creation message to console
 */
const ensureUploadsDirectory = () => {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log(`'uploads' directory created at: ${UPLOADS_DIR}`);
  }
};

/**
 * Storage configuration for multer
 * Defines where files are stored and how they're named
 */
const storage = multer.diskStorage({
  // Set destination directory for uploaded files
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },

  // Generate filename based on field type to preserve original names
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const originalName = path.basename(file.originalname, ext);
    let finalName;

    // Sanitize filename to remove dangerous characters
    let safeName = originalName.replace(/[\/\\:*?"<>|]/g, '_');

    if (file.fieldname === 'upload' || file.fieldname === 'uploadServiceFile') {
      // For new request files: Use original name only
      finalName = safeName + ext;
    } else if (file.fieldname === 'additionalFiles') {
      // For revision files: Add '-revised' suffix and preserve original name
      finalName = safeName + '-revised' + ext;
    } else {
      // Fallback for other field types: Use random suffix for safety
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      finalName = safeName + '-' + uniqueSuffix + ext;
    }

    // Handle potential collisions by adding millisecond timestamp if file exists
    let counter = 0;
    let finalPath = path.join(UPLOADS_DIR, finalName);
    while (fs.existsSync(finalPath) && counter < 1000) {
      // Insert timestamp before extension if collision detected
      const counterExt = path.extname(finalName);
      const counterBase = path.basename(finalName, counterExt);
      finalName = counterBase + '_' + Date.now() + counterExt;
      finalPath = path.join(UPLOADS_DIR, finalName);
      counter++;
    }

    cb(null, finalName);
  }
});

/**
 * File filter configuration
 * Dynamically checks allowed file types from database settings
 */
const fileFilter = (req, file, cb) => {
  // Get allowed file types from settings
  const allowedFileTypes = settingsService.getSetting('allowedFileTypes', [
    'pdf', 'jpg', 'jpeg', 'png', 'gif', 'doc', 'docx', 'xlsx', 'xls', 'txt', 'pptx'
  ]);

  // Map extensions to MIME types
  const mimeTypeMap = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  };

  // Build allowed MIME types from settings
  const allowedMimeTypes = allowedFileTypes.map(ext => mimeTypeMap[ext.toLowerCase()]).filter(Boolean);

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error(`Invalid file type. Only ${allowedFileTypes.join(', ')} files are allowed.`), false); // Reject file
  }
};

/**
 * Multer upload configuration
 * Configured storage, file filter, and limits (dynamically from settings)
 */
const getUploadConfig = () => {
  const maxFileSize = settingsService.getSetting('maxFileSize', 10); // Default 10MB
  
  return multer({
    storage: storage,
    limits: {
      fileSize: maxFileSize * 1024 * 1024, // Convert MB to bytes
      files: 20 // Allow up to 20 files per upload
    },
    fileFilter: fileFilter
  });
};

// Export a getter that creates upload middleware with current settings
const upload = getUploadConfig();

module.exports = {
  upload,
  UPLOADS_DIR,
  ensureUploadsDirectory
};
