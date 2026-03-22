import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  authRateLimiter,
  otpRateLimiter,
  passwordResetRateLimiter,
} from '../middlewares/rateLimiter.middleware';
import {
  registerSchema,
  verifyEmailSchema,
  resendOtpSchema,
  loginSchema,
  requestLoginOtpSchema,
  loginWithOtpSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  logoutSchema,
} from '../validations/auth.validation';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
//  PUBLIC ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  authController.register
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify email using OTP
 * @access  Public
 */
router.post(
  '/verify-email',
  otpRateLimiter,
  validate(verifyEmailSchema),
  authController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/resend-otp
 * @desc    Resend OTP
 * @access  Public
 */
router.post(
  '/resend-otp',
  otpRateLimiter,
  validate(resendOtpSchema),
  authController.resendOtp
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  authController.login
);

/**
 * @route   POST /api/v1/auth/login/request-otp
 * @desc    Request OTP for passwordless login
 * @access  Public
 */
router.post(
  '/login/request-otp',
  otpRateLimiter,
  validate(requestLoginOtpSchema),
  authController.requestLoginOtp
);

/**
 * @route   POST /api/v1/auth/login/otp
 * @desc    Login with OTP
 * @access  Public
 */
router.post(
  '/login/otp',
  authRateLimiter,
  validate(loginWithOtpSchema),
  authController.loginWithOtp
);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  authController.refreshToken
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 */
router.post(
  '/forgot-password',
  passwordResetRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
router.post(
  '/reset-password',
  passwordResetRateLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

// ─────────────────────────────────────────────────────────────────────────────
//  PROTECTED ROUTES (Require valid access token)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get currently authenticated user's profile
 * @access  Protected
 */
router.get('/me', authenticate, authController.getMe);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout (revoke refresh token)
 * @access  Protected
 */
router.post(
  '/logout',
  authenticate,
  validate(logoutSchema),
  authController.logout
);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all devices
 * @access  Protected
 */
router.post('/logout-all', authenticate, authController.logoutAll);

/**
 * @route   GET /api/v1/auth/sessions
 * @desc    Get all active sessions for the current user
 * @access  Protected
 */
router.get('/sessions', authenticate, authController.getSessions);

/**
 * @route   DELETE /api/v1/auth/sessions/:tokenId
 * @desc    Revoke a specific session
 * @access  Protected
 */
router.delete('/sessions/:tokenId', authenticate, authController.revokeSession);

/**
 * @route   GET /api/v1/auth/login-history
 * @desc    Get login history for the current user
 * @access  Protected
 */
router.get('/login-history', authenticate, authController.getLoginHistory);

export default router;
