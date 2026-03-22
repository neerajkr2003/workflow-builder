import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { verifyAccessToken } from '../services/jwt.service';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/response';

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token is missing or malformed. Use: Bearer <token>', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Access token is required', 401);
    }

    const decoded = verifyAccessToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
      return;
    }

    const err = error as Error;
    if (err.name === 'TokenExpiredError') {
      sendError(res, 'Access token has expired. Please refresh your token.', 401);
      return;
    }
    if (err.name === 'JsonWebTokenError') {
      sendError(res, 'Invalid access token.', 401);
      return;
    }

    sendError(res, 'Authentication failed.', 401);
  }
};

// ─── Optional Auth (doesn't fail if no token) ─────────────────────────────────
export const optionalAuthenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = verifyAccessToken(token);
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
      }
    }
  } catch {
    // Silently ignore — optional auth
  }
  next();
};
