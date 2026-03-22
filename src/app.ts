import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import config from './config';
import routes from './routes';
import { globalRateLimiter } from './middlewares/rateLimiter.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

const createApp = (): Application => {
  const app = express();

  // ─── Security Headers (Helmet) ──────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: config.nodeEnv === 'production',
    })
  );

  // ─── CORS ───────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = [
          config.client.url,
          'http://localhost:3000',
          'http://localhost:5173',
        ];
        // Allow requests with no origin (Postman, mobile apps, curl)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`CORS policy: Origin "${origin}" not allowed.`));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      maxAge: 86400, // 24h preflight cache
    })
  );

  // ─── Body Parsers ───────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));        // Prevent large payload attacks
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // ─── Trust Proxy (for accurate IP behind load balancers) ────────────────────
  app.set('trust proxy', 1);

  // ─── Global Rate Limiter ────────────────────────────────────────────────────
  app.use(globalRateLimiter);

  // ─── API Routes ─────────────────────────────────────────────────────────────
  app.use(`/api/${config.apiVersion}`, routes);

  // ─── Root ───────────────────────────────────────────────────────────────────
  app.get('/', (_req, res) => {
    res.json({
      name: 'Auth Module API',
      version: config.apiVersion,
      status: 'running',
      docs: `/api/${config.apiVersion}/health`,
    });
  });

  // ─── 404 Handler ───────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ─── Global Error Handler ───────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
};

export default createApp;
