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

  // Generate unique filename to prevent conflicts
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
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
