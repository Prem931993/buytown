import Client from 'ftp';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

// FTP Configuration
const ftpConfig = {
  host: process.env.FTP_HOST || '',
  port: parseInt(process.env.FTP_PORT) || '',
  user: process.env.FTP_USER || '',
  password: process.env.FTP_PASSWORD || '',
  secure: process.env.FTP_SECURE === 'true' || false,
  basePath: process.env.FTP_BASE_PATH || ''
};

// Multer storage for local file uploads (fallback)
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

// Memory storage for FTP uploads
const memoryStorage = multer.memoryStorage();

// Multer upload middleware
export const getUploadMiddleware = () => {
  if (process.env.FTP_HOST) {
    return multer({ storage: memoryStorage });
  } else {
    return multer({ storage: localStorage });
  }
};

// Upload file to FTP
export const uploadToFTP = async (fileData, folder, resource_type = 'image') => {
  if (!process.env.FTP_HOST) {
    throw new Error('FTP configuration not found');
  }

  return new Promise((resolve, reject) => {
    const client = new Client();

    client.on('ready', () => {
      // Ensure base directory exists
      client.mkdir(ftpConfig.basePath, true, (err) => {
        if (err && err.code !== 550) { // 550 = directory already exists
          client.end();
          return reject(new Error(`FTP mkdir failed: ${err.message}`));
        }

        // Create folder directory
        const folderPath = path.posix.join(ftpConfig.basePath, folder);
        client.mkdir(folderPath, true, (err) => {
          if (err && err.code !== 550) {
            client.end();
            return reject(new Error(`FTP mkdir folder failed: ${err.message}`));
          }

          // Generate unique filename
          const timestamp = Date.now();
          const extension = resource_type === 'video' ? '.mp4' : '.jpg';
          const filename = `${timestamp}-${Math.random().toString(36).substring(2)}${extension}`;
          const remotePath = path.posix.join(folderPath, filename);

          // Upload file
          if (Buffer.isBuffer(fileData)) {
            // Upload buffer directly
            client.put(fileData, remotePath, (err) => {
              client.end();
              if (err) {
                return reject(new Error(`FTP upload failed: ${err.message}`));
              }

              // Construct public URL
              const publicUrl = `${process.env.FTP_PUBLIC_URL || 'https://buytownonline.com'}/uploads/${folder}/${filename}`;
              resolve({
                secure_url: publicUrl,
                public_id: `${folder}/${filename}`,
                url: publicUrl
              });
            });
          } else {
            // Upload from file path
            client.put(fileData, remotePath, (err) => {
              client.end();
              if (err) {
                return reject(new Error(`FTP upload failed: ${err.message}`));
              }

              const publicUrl = `${process.env.FTP_PUBLIC_URL || 'https://buytownonline.com'}/uploads/${folder}/${filename}`;
              resolve({
                secure_url: publicUrl,
                public_id: `${folder}/${filename}`,
                url: publicUrl
              });
            });
          }
        });
      });
    });

    client.on('error', (err) => {
      reject(new Error(`FTP connection failed: ${err.message}`));
    });

    client.connect(ftpConfig);
  });
};

// Delete file from FTP
export const deleteFromFTP = (publicId, resource_type = 'image') => {
  if (!process.env.FTP_HOST) {
    return Promise.reject(new Error('FTP configuration not found'));
  }

  return new Promise((resolve, reject) => {
    const client = new Client();

    client.on('ready', () => {
      const remotePath = path.posix.join(ftpConfig.basePath, publicId);

      client.delete(remotePath, (err) => {
        client.end();
        if (err) {
          return reject(new Error(`FTP delete failed: ${err.message}`));
        }
        resolve({ result: 'ok' });
      });
    });

    client.on('error', (err) => {
      reject(new Error(`FTP connection failed: ${err.message}`));
    });

    client.connect(ftpConfig);
  });
};

// Extract public ID from FTP URL
export const extractPublicIdFromUrl = (url) => {
  if (!url) return null;
  try {
    const urlParts = url.split('/uploads/');
    if (urlParts.length > 1) {
      return urlParts[1];
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Check if URL is an FTP URL
export const isFTPUrl = (url) => {
  return url && url.includes('/uploads/');
};

// Upload file buffer to FTP (alias for backward compatibility)
export const uploadBufferToFTP = (buffer, folder, resource_type = 'image') => {
  return uploadToFTP(buffer, folder, resource_type);
};
