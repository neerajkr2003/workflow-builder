import User from '../models/User';
import LoginHistory from '../models/LoginHistory';
import { IUser, OTPPurpose, UserRole, AuthResponse, TokenPair } from '../types';
import { AppError } from '../utils/AppError';
import * as jwtService from './jwt.service';
import * as otpService from './otp.service';
import * as emailService from './email.service';

// ─── Register ─────────────────────────────────────────────────────────────────
export const registerUser = async (
  name: string,
  email: string,
  phone: string,
  password: string
): Promise<{ userId: string }> => {
  // Check duplicates
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) throw new AppError('Email already registered', 409);

  const existingPhone = await User.findOne({ phone });
  if (existingPhone) throw new AppError('Phone number already registered', 409);

  const user = await User.create({ name, email, phone, password, role: UserRole.USER });

  // Generate & send verification OTP
  const otp = await otpService.createOtp(user._id.toString(), OTPPurpose.EMAIL_VERIFICATION);
  await emailService.sendOtpEmail(email, name, otp, OTPPurpose.EMAIL_VERIFICATION);

  return { userId: user._id.toString() };
};

// ─── Verify Email OTP ─────────────────────────────────────────────────────────
export const verifyEmailOtp = async (
  userId: string,
  otpCode: string
): Promise<void> => {
  await otpService.verifyOtp(userId, otpCode, OTPPurpose.EMAIL_VERIFICATION);

  const user = await User.findByIdAndUpdate(
    userId,
    { isVerified: true },
    { new: true }
  );

  if (!user) throw new AppError('User not found', 404);

  await emailService.sendWelcomeEmail(user.email, user.name);
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
export const resendOtp = async (
  userId: string,
  purpose: OTPPurpose
): Promise<void> => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const otp = await otpService.createOtp(userId, purpose);
  await emailService.sendOtpEmail(user.email, user.name, otp, purpose);
};

// ─── Login with Email/Password ────────────────────────────────────────────────
export const loginWithPassword = async (
  email: string,
  password: string,
  deviceInfo?: string,
  ipAddress?: string
): Promise<AuthResponse> => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account has been deactivated. Please contact support.', 403);
  }

  // Check account lock
  if (user.isLocked()) {
    const lockMinutes = Math.ceil(
      ((user.lockUntil?.getTime() || 0) - Date.now()) / 60000
    );
    await recordLoginHistory(user._id.toString(), ipAddress, deviceInfo, 'failed', 'Account locked');
    throw new AppError(
      `Account is temporarily locked. Try again in ${lockMinutes} minute(s).`,
      423
    );
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    await user.incrementLoginAttempts();
    await recordLoginHistory(user._id.toString(), ipAddress, deviceInfo, 'failed', 'Invalid password');
    throw new AppError('Invalid credentials', 401);
  }

  if (!user.isVerified) {
    throw new AppError('Please verify your email address first.', 403);
  }

  await user.resetLoginAttempts();
  await recordLoginHistory(user._id.toString(), ipAddress, deviceInfo, 'success');

  return buildAuthResponse(user, deviceInfo, ipAddress);
};

// ─── Request Login OTP ────────────────────────────────────────────────────────
export const requestLoginOtp = async (email: string): Promise<{ userId: string }> => {
  const user = await User.findOne({ email: email.toLowerCase() });

  // Security: Always return same message to prevent email enumeration
  if (!user || !user.isVerified || !user.isActive) {
    if (!user) return { userId: 'not-found' }; // Silent fail
    throw new AppError('Account is not eligible for OTP login.', 403);
  }

  const otp = await otpService.createOtp(user._id.toString(), OTPPurpose.LOGIN);
  await emailService.sendOtpEmail(user.email, user.name, otp, OTPPurpose.LOGIN);

  return { userId: user._id.toString() };
};

// ─── Login with OTP ───────────────────────────────────────────────────────────
export const loginWithOtp = async (
  userId: string,
  otpCode: string,
  deviceInfo?: string,
  ipAddress?: string
): Promise<AuthResponse> => {
  const user = await User.findById(userId);
  if (!user || !user.isActive) throw new AppError('User not found or inactive', 404);

  await otpService.verifyOtp(userId, otpCode, OTPPurpose.LOGIN);

  if (!user.isVerified) {
    throw new AppError('Please verify your email address first.', 403);
  }

  await user.resetLoginAttempts();
  await recordLoginHistory(userId, ipAddress, deviceInfo, 'success');

  return buildAuthResponse(user, deviceInfo, ipAddress);
};

// ─── Refresh Tokens ───────────────────────────────────────────────────────────
export const refreshTokens = async (
  refreshToken: string,
  deviceInfo?: string,
  ipAddress?: string
): Promise<TokenPair> => {
  const { userId, tokenDoc } = await jwtService.validateRefreshToken(refreshToken);

  const user = await User.findById(userId);
  if (!user || !user.isActive) throw new AppError('User not found or inactive', 404);

  // Rotate: revoke old, issue new
  await jwtService.revokeRefreshToken(refreshToken);

  const accessToken = jwtService.generateAccessToken(userId, user.email, user.role);
  const newRefreshToken = await jwtService.generateRefreshToken(
    userId,
    deviceInfo || tokenDoc.deviceInfo,
    ipAddress || tokenDoc.ipAddress
  );

  return { accessToken, refreshToken: newRefreshToken };
};

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPassword = async (email: string): Promise<void> => {
  const user = await User.findOne({ email: email.toLowerCase() });

  // Silent fail to prevent email enumeration
  if (!user || !user.isActive) return;

  const resetToken = jwtService.generateResetToken(user._id.toString(), user.email);
  await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
};

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<void> => {
  let payload;
  try {
    payload = jwtService.verifyResetToken(token);
  } catch {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const user = await User.findById(payload.userId).select('+password');
  if (!user) throw new AppError('User not found', 404);

  // Prevent reuse of same password
  const isSamePassword = await user.comparePassword(newPassword);
  if (isSamePassword) {
    throw new AppError('New password must be different from the current password.', 400);
  }

  user.password = newPassword;
  await user.save();

  // Invalidate all sessions after password change
  await jwtService.revokeAllUserTokens(user._id.toString());
};

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = async (refreshToken?: string, userId?: string): Promise<void> => {
  if (refreshToken) {
    await jwtService.revokeRefreshToken(refreshToken);
  }
  // Optionally revoke all sessions
};

export const logoutAll = async (userId: string): Promise<void> => {
  await jwtService.revokeAllUserTokens(userId);
};

// ─── Get User Profile ─────────────────────────────────────────────────────────
export const getUserProfile = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
};

// ─── Login History ────────────────────────────────────────────────────────────
export const getLoginHistory = async (userId: string) => {
  return LoginHistory.find({ userId }).sort({ createdAt: -1 }).limit(20);
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const buildAuthResponse = async (
  user: IUser,
  deviceInfo?: string,
  ipAddress?: string
): Promise<AuthResponse> => {
  const userId = user._id.toString();
  const accessToken = jwtService.generateAccessToken(userId, user.email, user.role);
  const refreshToken = await jwtService.generateRefreshToken(userId, deviceInfo, ipAddress);

  return {
    user: {
      id: userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
    },
    tokens: { accessToken, refreshToken },
  };
};

const recordLoginHistory = async (
  userId: string,
  ipAddress?: string,
  deviceInfo?: string,
  status?: 'success' | 'failed',
  reason?: string
): Promise<void> => {
  try {
    await LoginHistory.create({
      userId,
      ipAddress: ipAddress || 'Unknown',
      deviceInfo: deviceInfo || 'Unknown Device',
      status,
      reason,
    });
  } catch {
    // Non-critical: don't throw
  }
};
