import crypto from 'crypto';
import Otp from '../models/Otp';
import { OTPPurpose } from '../types';
import config from '../config';
import { AppError } from '../utils/AppError';

// ─── Generate 6-digit OTP ─────────────────────────────────────────────────────
const generateOtpCode = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

// ─── Create / Regenerate OTP ──────────────────────────────────────────────────
export const createOtp = async (
  userId: string,
  purpose: OTPPurpose
): Promise<string> => {
  // Check resend limit
  const existingOtp = await Otp.findOne({ userId, purpose, isUsed: false });

  if (existingOtp) {
    if (existingOtp.resendCount >= config.otp.maxResend) {
      throw new AppError(
        `Maximum OTP resend limit (${config.otp.maxResend}) reached. Please try again later.`,
        429
      );
    }

    // Cooldown: 60 seconds between resends
    if (existingOtp.lastResendAt) {
      const cooldownMs = 60 * 1000;
      if (Date.now() - existingOtp.lastResendAt.getTime() < cooldownMs) {
        const waitSecs = Math.ceil(
          (cooldownMs - (Date.now() - existingOtp.lastResendAt.getTime())) / 1000
        );
        throw new AppError(`Please wait ${waitSecs}s before requesting a new OTP.`, 429);
      }
    }

    // Delete old OTP and create fresh one
    await Otp.findByIdAndDelete(existingOtp._id);
  }

  const otpCode = generateOtpCode();
  const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60 * 1000);

  await Otp.create({
    userId,
    otp: otpCode,
    purpose,
    expiresAt,
    attempts: 0,
    resendCount: existingOtp ? existingOtp.resendCount + 1 : 0,
    lastResendAt: existingOtp ? new Date() : undefined,
    isUsed: false,
  });

  return otpCode;
};

// ─── Verify OTP ───────────────────────────────────────────────────────────────
export const verifyOtp = async (
  userId: string,
  otpCode: string,
  purpose: OTPPurpose
): Promise<boolean> => {
  const otpDoc = await Otp.findOne({
    userId,
    purpose,
    isUsed: false,
  }).select('+otp');

  if (!otpDoc) {
    throw new AppError('No active OTP found. Please request a new one.', 400);
  }

  if (otpDoc.expiresAt < new Date()) {
    await Otp.findByIdAndDelete(otpDoc._id);
    throw new AppError('OTP has expired. Please request a new one.', 400);
  }

  if (otpDoc.attempts >= config.otp.maxAttempts) {
    await Otp.findByIdAndDelete(otpDoc._id);
    throw new AppError(
      `Maximum OTP attempts (${config.otp.maxAttempts}) exceeded. Please request a new OTP.`,
      400
    );
  }

  if (otpDoc.otp !== otpCode) {
    await otpDoc.updateOne({ $inc: { attempts: 1 } });
    const remaining = config.otp.maxAttempts - (otpDoc.attempts + 1);
    throw new AppError(
      `Invalid OTP. ${remaining} attempt(s) remaining.`,
      400
    );
  }

  // Mark as used
  await Otp.findByIdAndUpdate(otpDoc._id, { isUsed: true });

  return true;
};

// ─── Cleanup Expired OTPs ─────────────────────────────────────────────────────
export const deleteUserOtps = async (
  userId: string,
  purpose: OTPPurpose
): Promise<void> => {
  await Otp.deleteMany({ userId, purpose });
};
