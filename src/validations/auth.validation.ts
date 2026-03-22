import { z } from 'zod';

// ─── Shared Field Validators ──────────────────────────────────────────────────
const emailField = z
  .string({ required_error: 'Email is required' })
  .email('Please provide a valid email address')
  .toLowerCase()
  .trim();

const passwordField = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const phoneField = z
  .string({ required_error: 'Phone number is required' })
  .regex(/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number (E.164 format)');

const otpField = z
  .string({ required_error: 'OTP is required' })
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d+$/, 'OTP must contain only digits');

// ─── Register ─────────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters')
      .trim(),
    email: emailField,
    phone: phoneField,
    password: passwordField,
  }),
});

// ─── Verify Email OTP ─────────────────────────────────────────────────────────
export const verifyEmailSchema = z.object({
  body: z.object({
    userId: z.string({ required_error: 'User ID is required' }).min(1),
    otp: otpField,
  }),
});

// ─── Resend OTP ───────────────────────────────────────────────────────────────
export const resendOtpSchema = z.object({
  body: z.object({
    userId: z.string({ required_error: 'User ID is required' }).min(1),
    purpose: z.enum(
      ['email_verification', 'login', 'password_reset'],
      { required_error: 'Purpose is required' }
    ),
  }),
});

// ─── Login ────────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  body: z.object({
    email: emailField,
    password: z.string({ required_error: 'Password is required' }).min(1),
  }),
});

// ─── Request Login OTP ────────────────────────────────────────────────────────
export const requestLoginOtpSchema = z.object({
  body: z.object({
    email: emailField,
  }),
});

// ─── Login with OTP ───────────────────────────────────────────────────────────
export const loginWithOtpSchema = z.object({
  body: z.object({
    userId: z.string({ required_error: 'User ID is required' }).min(1),
    otp: otpField,
  }),
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string({ required_error: 'Refresh token is required' }).min(1),
  }),
});

// ─── Forgot Password ──────────────────────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailField,
  }),
});

// ─── Reset Password ───────────────────────────────────────────────────────────
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string({ required_error: 'Reset token is required' }).min(1),
    password: passwordField,
    confirmPassword: z.string({ required_error: 'Confirm password is required' }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

// ─── Type Exports ─────────────────────────────────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>['body'];
export type ResendOtpInput = z.infer<typeof resendOtpSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RequestLoginOtpInput = z.infer<typeof requestLoginOtpSchema>['body'];
export type LoginWithOtpInput = z.infer<typeof loginWithOtpSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>['body'];
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>['body'];
