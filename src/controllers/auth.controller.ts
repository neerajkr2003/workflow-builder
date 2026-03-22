import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess, sendCreated, sendError } from '../utils/response';
import { AuthenticatedRequest, OTPPurpose } from '../types';
import * as authService from '../services/auth.service';
import * as jwtService from '../services/jwt.service';

// ─── Register ─────────────────────────────────────────────────────────────────
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, password } = req.body;

  const result = await authService.registerUser(name, email, phone, password);

  sendCreated(res, 'Registration successful. Please check your email for the OTP to verify your account.', {
    userId: result.userId,
  });
});

// ─── Verify Email ─────────────────────────────────────────────────────────────
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { userId, otp } = req.body;

  await authService.verifyEmailOtp(userId, otp);

  sendSuccess(res, 'Email verified successfully. Welcome aboard!');
});

// ─── Resend OTP ───────────────────────────────────────────────────────────────
export const resendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { userId, purpose } = req.body;

  await authService.resendOtp(userId, purpose as OTPPurpose);

  sendSuccess(res, 'OTP resent successfully. Please check your email.');
});

// ─── Login with Password ──────────────────────────────────────────────────────
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()
    || req.socket.remoteAddress
    || 'Unknown';

  const result = await authService.loginWithPassword(email, password, deviceInfo, ipAddress);

  sendSuccess(res, 'Login successful.', result);
});

// ─── Request Login OTP ────────────────────────────────────────────────────────
export const requestLoginOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const result = await authService.requestLoginOtp(email);

  // Always return success to prevent email enumeration
  sendSuccess(res, 'If an account exists with this email, an OTP has been sent.', {
    userId: result.userId !== 'not-found' ? result.userId : undefined,
  });
});

// ─── Login with OTP ───────────────────────────────────────────────────────────
export const loginWithOtp = asyncHandler(async (req: Request, res: Response) => {
  const { userId, otp } = req.body;
  const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()
    || req.socket.remoteAddress
    || 'Unknown';

  const result = await authService.loginWithOtp(userId, otp, deviceInfo, ipAddress);

  sendSuccess(res, 'Login successful.', result);
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;
  const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim()
    || req.socket.remoteAddress
    || 'Unknown';

  const tokens = await authService.refreshTokens(token, deviceInfo, ipAddress);

  sendSuccess(res, 'Tokens refreshed successfully.', { tokens });
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  await authService.forgotPassword(email);

  // Always return success to prevent email enumeration
  sendSuccess(res, 'If an account exists with this email, a password reset link has been sent.');
});

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  await authService.resetPassword(token, password);

  sendSuccess(res, 'Password reset successfully. All sessions have been invalidated. Please log in again.');
});

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { refreshToken: token } = req.body;
  const userId = req.user?.userId;

  await authService.logout(token, userId);

  sendSuccess(res, 'Logged out successfully.');
});

// ─── Logout All Devices ───────────────────────────────────────────────────────
export const logoutAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  await authService.logoutAll(userId);

  sendSuccess(res, 'Logged out from all devices successfully.');
});

// ─── Get Profile (/auth/me) ───────────────────────────────────────────────────
export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  const user = await authService.getUserProfile(userId);

  sendSuccess(res, 'Profile fetched successfully.', { user });
});

// ─── Get Active Sessions ──────────────────────────────────────────────────────
export const getSessions = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  const sessions = await jwtService.getActiveSessions(userId);

  sendSuccess(res, 'Active sessions fetched.', { sessions });
});

// ─── Get Login History ────────────────────────────────────────────────────────
export const getLoginHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  const history = await authService.getLoginHistory(userId);

  sendSuccess(res, 'Login history fetched.', { history });
});

// ─── Revoke Session ───────────────────────────────────────────────────────────
export const revokeSession = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { tokenId } = req.params;
  const userId = req.user!.userId;

  // Validate the token belongs to the requesting user
  const { default: RefreshToken } = await import('../models/RefreshToken');
  const token = await RefreshToken.findOne({ _id: tokenId, userId });

  if (!token) {
    return sendError(res, 'Session not found', 404);
  }

  await jwtService.revokeRefreshToken(token.token);

  sendSuccess(res, 'Session revoked successfully.');
});
