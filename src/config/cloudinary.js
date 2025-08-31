import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

// Multer storage for local file uploads (development) - with buffer support
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = `uploads/${req.params.module}`;
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Memory storage for Cloudinary uploads (production)
const memoryStorage = multer.memoryStorage();

// Multer upload middleware
export const getUploadMiddleware = () => {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    return multer({ storage: memoryStorage });
  } else {
    return multer({ storage: localStorage });
  }
};

// Upload file to Cloudinary (for production) - accepts both file path and buffer
export const uploadToCloudinary = async (fileData, folder, resource_type = 'image') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary configuration not found');
  }

  try {
    let result;
    if (Buffer.isBuffer(fileData)) {
      // Handle buffer upload
      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            resource_type: resource_type,
          },
          (error, uploadResult) => {
            if (error) return reject(error);
            resolve(uploadResult);
          }
        );
        uploadStream.end(fileData);
      });
    } else {
      // Handle file path upload
      result = await cloudinary.uploader.upload(fileData, {
        folder: folder,
        resource_type: resource_type,
      });
    }
    return result;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

// Upload file buffer to Cloudinary (alias for backward compatibility)
export const uploadBufferToCloudinary = (buffer, folder, resource_type = 'image') => {
  return uploadToCloudinary(buffer, folder, resource_type);
};

// Delete file from Cloudinary by public ID
export const deleteFromCloudinary = (publicId, resource_type = 'image') => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, { resource_type }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
  });
};

// Extract public ID from Cloudinary URL
export const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const fileName = parts.pop();
  const publicIdWithExt = fileName.split('.')[0];
  const folder = parts.slice(parts.indexOf('upload') + 1).join('/');
  return folder ? `${folder}/${publicIdWithExt}` : publicIdWithExt;
};

// Check if URL is a Cloudinary URL
export const isCloudinaryUrl = (url) => {
  return url && url.includes('res.cloudinary.com');
};
