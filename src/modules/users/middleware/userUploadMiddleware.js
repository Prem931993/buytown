import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { uploadToFTP } from '../../../config/ftp.js';

// Configure multer storage based on environment
let storage;

if (process.env.FTP_HOST) {
  // Use memory storage for FTP
  storage = multer.memoryStorage();
} else {
  // Use disk storage for local development
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Ensure uploads directory exists
      const uploadDir = 'uploads/';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Generate unique filename with timestamp
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
  // Allow images for profile_photo and license
  if (file.fieldname === 'profile_photo' || file.fieldname === 'license') {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and PDF files are allowed.'), false);
    }
  } else {
    cb(null, true); // Allow other fields
  }
};

// Configure multer with limits and file filter
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for license files
  },
  fileFilter: fileFilter
});

// Middleware for handling user creation/update with file uploads
// Use .any() to handle both text and file fields
export const uploadUserFiles = upload.any();

// Helper function to upload files to FTP if configured
export const processUserFiles = async (req) => {
  if (!req.files || req.files.length === 0) {
    return;
  }

  if (process.env.FTP_HOST) {
    for (const file of req.files) {
      try {
        const result = await uploadToFTP(file.buffer, 'users', 'image');
        // Store the FTP URL in the request body
        req.body[file.fieldname] = result.secure_url;
      } catch (error) {
        console.error(`[USER_MIDDLEWARE] FTP upload failed for ${file.fieldname}:`, error);
        throw error;
      }
    }
  } else {
    // For local storage, the filename is already set by multer
    req.files.forEach(file => {
      req.body[file.fieldname] = file.filename;
    });
  }
};

export default uploadUserFiles;
