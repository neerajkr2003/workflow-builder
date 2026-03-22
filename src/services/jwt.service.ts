import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config';
import RefreshToken from '../models/RefreshToken';
import { JwtAccessPayload, JwtRefreshPayload, JwtResetPayload, UserRole } from '../types';

// ─── Generate Access Token ────────────────────────────────────────────────────
export const generateAccessToken = (
  userId: string,
  email: string,
  role: UserRole
): string => {
  const payload: JwtAccessPayload = { userId, email, role, type: 'access' };
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

// ─── Generate Refresh Token ───────────────────────────────────────────────────
export const generateRefreshToken = async (
  userId: string,
  deviceInfo?: string,
  ipAddress?: string
): Promise<string> => {
  // Create a unique opaque token
  const token = crypto.randomBytes(64).toString('hex');

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await RefreshToken.create({
    userId,
    token,
    expiresAt,
    deviceInfo: deviceInfo || 'Unknown Device',
    ipAddress: ipAddress || 'Unknown',
    isRevoked: false,
  });

  return token;
};

// ─── Verify Access Token ──────────────────────────────────────────────────────
export const verifyAccessToken = (token: string): JwtAccessPayload => {
  const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtAccessPayload;
  if (decoded.type !== 'access') {
    throw new Error('Invalid token type');
  }
  return decoded;
};

// ─── Validate Refresh Token ───────────────────────────────────────────────────
export const validateRefreshToken = async (
  token: string
): Promise<{ userId: string; tokenDoc: InstanceType<typeof RefreshToken> }> => {
  const tokenDoc = await RefreshToken.findOne({ token, isRevoked: false });

  if (!tokenDoc) {
    throw new Error('Invalid or revoked refresh token');
  }

  if (tokenDoc.expiresAt < new Date()) {
    await RefreshToken.findByIdAndDelete(tokenDoc._id);
    throw new Error('Refresh token expired');
  }

  return { userId: tokenDoc.userId.toString(), tokenDoc };
};

// ─── Revoke Refresh Token ─────────────────────────────────────────────────────
export const revokeRefreshToken = async (token: string): Promise<void> => {
  await RefreshToken.findOneAndUpdate({ token }, { isRevoked: true });
};

// ─── Revoke All User Refresh Tokens ──────────────────────────────────────────
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await RefreshToken.updateMany({ userId, isRevoked: false }, { isRevoked: true });
};

// ─── Generate Password Reset Token ───────────────────────────────────────────
export const generateResetToken = (userId: string, email: string): string => {
  const payload: JwtResetPayload = { userId, email, type: 'reset' };
  return jwt.sign(payload, config.jwt.resetSecret, {
    expiresIn: config.jwt.resetExpiresIn as jwt.SignOptions['expiresIn'],
  });
};

// ─── Verify Reset Token ───────────────────────────────────────────────────────
export const verifyResetToken = (token: string): JwtResetPayload => {
  const decoded = jwt.verify(token, config.jwt.resetSecret) as JwtResetPayload;
  if (decoded.type !== 'reset') {
    throw new Error('Invalid token type');
  }
  return decoded;
};

// ─── Get Active Sessions ──────────────────────────────────────────────────────
export const getActiveSessions = async (userId: string) => {
  return RefreshToken.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  }).select('-token').sort({ createdAt: -1 });
};
