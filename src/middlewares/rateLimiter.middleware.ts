import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response';
import config from '../config';

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,   // 15 min
  max: config.rateLimit.max,             // 100 req/window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Too many requests from this IP. Please try again later.',
      429
    );
  },
});

// ─── Auth Routes Rate Limiter (stricter) ──────────────────────────────────────
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,             // 15 min
  max: config.rateLimit.authMax,         // 10 auth attempts
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,          // Don't count successful logins
  handler: (_req, res) => {
    sendError(
      res,
      'Too many authentication attempts. Please wait 15 minutes before trying again.',
      429
    );
  },
});

// ─── OTP Rate Limiter ─────────────────────────────────────────────────────────
export const otpRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,             // 1 hour
  max: 10,                               // 10 OTP requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Too many OTP requests. Please try again after an hour.',
      429
    );
  },
});

// ─── Password Reset Rate Limiter ──────────────────────────────────────────────
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,             // 1 hour
  max: 5,                                // 5 reset attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'Too many password reset requests. Please try again after an hour.',
      429
    );
  },
});
