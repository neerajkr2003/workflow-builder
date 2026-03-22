import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import { authenticate } from '../middlewares/auth.middleware';
import { requireAdmin, requireSuperAdmin } from '../middlewares/role.middleware';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../types';

const router = Router();

// ─── Auth Routes ──────────────────────────────────────────────────────────────
router.use('/auth', authRoutes);

// ─── Admin Example Route (RBAC Demo) ─────────────────────────────────────────
router.get(
  '/admin/dashboard',
  authenticate,
  requireAdmin,
  (req: AuthenticatedRequest, res: Response) => {
    sendSuccess(res, 'Admin dashboard accessed.', {
      admin: req.user,
    });
  }
);

// ─── Super Admin Route ────────────────────────────────────────────────────────
router.get(
  '/super-admin/settings',
  authenticate,
  requireSuperAdmin,
  (req: AuthenticatedRequest, res: Response) => {
    sendSuccess(res, 'Super admin settings accessed.', {
      admin: req.user,
    });
  }
);

// ─── Health Check ─────────────────────────────────────────────────────────────
router.get('/health', (_req: Request, res: Response) => {
  sendSuccess(res, 'Server is healthy 🟢', {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
