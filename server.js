import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

import authRoutes from './src/modules/auth/routes/authRoutes.js';
import smsRoutes from './src/modules/auth/routes/sms.routes.js';
import categoryRoutes from './src/modules/categories/routes/category.routes.js';
import brandRoutes from './src/modules/brands/routes/brand.routes.js';
import variationRoutes from './src/modules/variations/routes/variation.routes.js';
import productRoutes from './src/modules/products/routes/product.routes.js';
import bannerRoutes from './src/modules/banners/routes/banner.routes.js';
import logoRoutes from './src/modules/logos/routes/logo.routes.js';
import userRoutes from './src/modules/users/routes/user.routes.js';
import { getUploadMiddleware, uploadToCloudinary } from './src/config/cloudinary.js';

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(json());
app.use(express.urlencoded({ extended: true }));

// Add security middleware here
app.use(helmet());

// Serve static files from frontend public directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine the correct public folder path based on environment
let frontendPublicPath;
if (process.env.NODE_ENV === 'production') {
  // In production, use the root public folder
  frontendPublicPath = path.join(__dirname, '../public');
} else {
  // In development, use the React app's public folder
  frontendPublicPath = path.join(__dirname, '../buytown-react/public');
}

app.use(express.static(frontendPublicPath));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Get upload middleware based on environment
const upload = getUploadMiddleware();

// File upload endpoint with Cloudinary support
app.post('/api/v1/upload/:module', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let filePath;
    
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      // Upload to Cloudinary when configured
      const result = await uploadToCloudinary(
        req.file.buffer,
        req.params.module,
        req.file.mimetype.startsWith('video/') ? 'video' : 'image'
      );

      filePath = result.secure_url;
    } else {
      // Use local storage when Cloudinary is not configured
      filePath = `/${req.params.module}/${req.file.filename}`;
    }

    res.status(200).json({ 
      message: 'File uploaded successfully', 
      filePath: filePath 
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

app.get('/', (req, res) => {
  res.send('🚀 BuyTown API is live on Railway!');
});

// const apiLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 100,
//   message: { statusCode: 429, error: 'Too many requests, please try again later.' }
// });
// app.use('/api/', apiLimiter);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sms', smsRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/variations', variationRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/banners', bannerRoutes);
app.use('/api/v1/logos', logoRoutes);
app.use('/api/v1/users', userRoutes);

app.post('/', (req, res) => res.send('BuyTown API Microservice'));

// Global error handler for JSON error responses
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    statusCode: 500,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
