// ===== File Upload Configuration =====
// This module handles file upload setup using multer middleware

const path = require('path');
const multer = require('multer');
const fs = require('fs');

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
 * Only allows specific file types for security
 */
const fileFilter = (req, file, cb) => {
  // Define allowed MIME types
  const allowedTypes = [
    'image/jpeg',        // JPEG images
    'image/png',         // PNG images
    'image/gif',         // GIF images
    'image/webp',        // WebP images
    'application/pdf',   // PDF documents
    'application/msword', // DOC files
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX files
    'application/vnd.ms-excel', // XLS files
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX files
    'text/plain'         // Plain text files
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false); // Reject file
  }
};

/**
 * Multer upload configuration
 * Configured storage, file filter, and limits
 */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 20 // Allow up to 20 files per upload
  },
  fileFilter: fileFilter
});

module.exports = {
  upload,
  UPLOADS_DIR,
  ensureUploadsDirectory
};
