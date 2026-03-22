import { Request } from 'express';
import { Document, Types } from 'mongoose';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum OTPPurpose {
  EMAIL_VERIFICATION = 'email_verification',
  LOGIN = 'login',
  PASSWORD_RESET = 'password_reset',
}

// ─── User Types ───────────────────────────────────────────────────────────────

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  loginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

// ─── OTP Types ────────────────────────────────────────────────────────────────

export interface IOtp extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  otp: string;
  purpose: OTPPurpose;
  expiresAt: Date;
  attempts: number;
  resendCount: number;
  lastResendAt?: Date;
  isUsed: boolean;
  createdAt: Date;
}

// ─── Refresh Token Types ──────────────────────────────────────────────────────

export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  deviceInfo?: string;
  ipAddress?: string;
  isRevoked: boolean;
  createdAt: Date;
}

// ─── Login History Types ──────────────────────────────────────────────────────

export interface ILoginHistory extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  ipAddress: string;
  deviceInfo: string;
  status: 'success' | 'failed';
  reason?: string;
  createdAt: Date;
}

// ─── JWT Payload ──────────────────────────────────────────────────────────────

export interface JwtAccessPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access';
}

export interface JwtRefreshPayload {
  userId: string;
  tokenId: string;
  type: 'refresh';
}

export interface JwtResetPayload {
  userId: string;
  email: string;
  type: 'reset';
}

// ─── Request Extensions ───────────────────────────────────────────────────────

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: UserRole;
  };
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  meta?: Record<string, unknown>;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    isVerified: boolean;
  };
  tokens: TokenPair;
}
