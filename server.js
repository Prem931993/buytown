import express, { json } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

import authRoutes from './src/modules/auth/routes/authRoutes.js';
import categoryRoutes from './src/modules/categories/routes/category.routes.js';
import brandRoutes from './src/modules/brands/routes/brand.routes.js';
import variationRoutes from './src/modules/variations/routes/variation.routes.js';
import productRoutes from './src/modules/products/routes/product.routes.js';

const app = express();
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(json());

// Add security middleware here
app.use(helmet());

// Serve static files from frontend public directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPublicPath = path.join(__dirname, '../frontend/public');
app.use(express.static(frontendPublicPath));

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
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/variations', variationRoutes);
app.use('/api/v1/products', productRoutes);

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
