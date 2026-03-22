import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../types';
import { sendError } from '../utils/response';

/**
 * Role-based access control middleware.
 * Must be used AFTER the authenticate middleware.
 *
 * Usage:
 *   router.get('/admin', authenticate, authorize(UserRole.ADMIN), handler)
 *   router.get('/super', authenticate, authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN), handler)
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required.', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
        403
      );
      return;
    }

    next();
  };
};

// ─── Convenience Exports ──────────────────────────────────────────────────────
export const requireAdmin = authorize(UserRole.ADMIN, UserRole.SUPER_ADMIN);
export const requireSuperAdmin = authorize(UserRole.SUPER_ADMIN);
export const requireUser = authorize(UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN);
