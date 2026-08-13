/**
 * Centralized error handling middleware.
 * Never exposes stack traces in production.
 */

export const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
};

export const errorHandler = (err, req, res, _next) => {
  const isProd = process.env.NODE_ENV === 'production';

  // Log full error in development, structured error in production
  if (!isProd) {
    console.error(`[ERROR] ${err.message}`, err.stack);
  } else {
    console.error(`[ERROR] ${err.name}: ${err.message} | Route: ${req.method} ${req.originalUrl}`);
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages.join('. ') });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired' });
  }

  // Multer file filter error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'File too large. Maximum size is 10MB.' });
  }

  if (err.message?.includes('Only PDF and image files')) {
    return res.status(400).json({ success: false, message: err.message });
  }

  // Generic application error with status code
  const statusCode = err.statusCode || 500;
  const message = isProd && statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({ success: false, message });
};
