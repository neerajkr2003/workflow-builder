import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/response';
import config from '../config';

// ─── Mongoose Error Handlers ──────────────────────────────────────────────────
const handleMongooseCastError = (err: mongoose.Error.CastError): AppError => {
  return new AppError(`Invalid ${err.path}: "${err.value}".`, 400);
};

const handleMongooseDuplicateKeyError = (err: Error & { code?: number; keyValue?: Record<string, unknown> }): AppError => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue?.[field];
  return new AppError(`Duplicate value for field "${field}": "${value}". Please use a different value.`, 409);
};

const handleMongooseValidationError = (err: mongoose.Error.ValidationError): AppError => {
  const errors: Record<string, string[]> = {};
  Object.values(err.errors).forEach((e) => {
    errors[e.path] = [e.message];
  });
  return new AppError('Validation failed.', 422);
};

// ─── JWT Error Handlers ───────────────────────────────────────────────────────
const handleJwtExpiredError = (): AppError =>
  new AppError('Your session has expired. Please log in again.', 401);

const handleJwtInvalidError = (): AppError =>
  new AppError('Invalid authentication token. Please log in again.', 401);

// ─── Development Error Response ───────────────────────────────────────────────
const sendDevError = (err: AppError, res: Response): void => {
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    errors: err.errors,
  });
};

// ─── Production Error Response ────────────────────────────────────────────────
const sendProdError = (err: AppError, res: Response): void => {
  if (err.isOperational) {
    sendError(res, err.message, err.statusCode, err.errors);
  } else {
    // Programming or unknown error: don't leak details
    console.error('💥 UNEXPECTED ERROR:', err);
    sendError(res, 'An unexpected error occurred. Please try again later.', 500);
  }
};

// ─── Global Error Handler ─────────────────────────────────────────────────────
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else {
    // Transform known error types
    const mongoErr = err as Error & { code?: number; keyValue?: Record<string, unknown> };

    if (err instanceof mongoose.Error.CastError) {
      error = handleMongooseCastError(err);
    } else if (mongoErr.code === 11000) {
      error = handleMongooseDuplicateKeyError(mongoErr);
    } else if (err instanceof mongoose.Error.ValidationError) {
      error = handleMongooseValidationError(err);
    } else if (err.name === 'TokenExpiredError') {
      error = handleJwtExpiredError();
    } else if (err.name === 'JsonWebTokenError') {
      error = handleJwtInvalidError();
    } else {
      // Unknown error
      error = new AppError(err.message || 'Internal server error', 500);
      error.isOperational === false; // Mark as non-operational
    }
  }

  if (config.nodeEnv === 'development') {
    sendDevError(error, res);
  } else {
    sendProdError(error, res);
  }
};

// ─── 404 Handler ──────────────────────────────────────────────────────────────
export const notFoundHandler = (req: Request, res: Response): void => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};
