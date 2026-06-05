import { ApiError } from '../utils/apiError.js';

// 404 for unmatched routes.
export function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// Central error handler -> consistent JSON shape.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details;

  // Mongoose validation errors -> 400 with field details.
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  }

  // Mongoose cast errors (bad ObjectId).
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Duplicate key.
  if (err.code === 11000) {
    statusCode = 409;
    message = `Duplicate value for ${Object.keys(err.keyValue || {}).join(', ')}`;
    details = err.keyValue;
  }

  if (statusCode >= 500) {
    console.error('[error]', err);
  }

  res.status(statusCode).json({ success: false, message, details });
}
