import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import recordRoutes from './routes/recordRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';
import familyRoutes from './routes/familyRoutes.js';
import reminderRoutes from './routes/reminderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import { setDbConnected } from './utils/dbStatus.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB injection protection
app.use(mongoSanitize());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true
}));

// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' }
});

app.use(generalLimiter);

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (_req, res) => res.json({
  ok: true,
  service: 'medivault-api',
  dbConnected: mongoose.connection.readyState === 1,
  environment: process.env.NODE_ENV || 'development',
  timestamp: new Date().toISOString()
}));

app.use(notFoundHandler);
app.use(errorHandler);

export const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/healthhub';
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[MongoDB] Connected successfully to ${uri}`);
    setDbConnected(true);
    // Enable buffering when connected
    mongoose.set('bufferCommands', true);
  } catch (error) {
    console.warn(`[MongoDB] Connection failed for ${uri}: ${error.message}`);
    // Try fallback URI if 127.0.0.1 was used
    if (uri.includes('127.0.0.1')) {
      const fallbackUri = uri.replace('127.0.0.1', 'localhost');
      try {
        console.log(`[MongoDB] Retrying connection with fallback URI: ${fallbackUri}`);
        await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 5000 });
        console.log(`[MongoDB] Connected successfully to ${fallbackUri}`);
        return;
      } catch (fallbackError) {
        console.error(`[MongoDB] Fallback connection failed: ${fallbackError.message}`);
      }
    }
    console.error('\n⚠️  [MongoDB Error] Could not connect to MongoDB server.');
    console.error('👉 Please make sure MongoDB service is running locally on port 27017, or set a valid MONGODB_URI in backend/.env (e.g. MongoDB Atlas URI).\n');
    setDbConnected(false);
    // Prevent mongoose from buffering commands which cause long timeouts
    mongoose.set('bufferCommands', false);
  }
};

export default app;
