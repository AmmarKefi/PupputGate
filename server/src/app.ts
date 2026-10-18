import express from 'express';
import path from 'node:path';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './env';
import { UPLOADS_DIR } from './lib/images';
import { errorMiddleware } from './lib/errors';
import { authRouter } from './routes/auth';
import { catalogRouter } from './routes/catalog';
import { businessRouter } from './routes/businesses';
import { appointmentRouter } from './routes/appointments';
import { orderRouter } from './routes/orders';
import { requestRouter } from './routes/requests';
import { activityRouter } from './routes/activity';
import { merchantRouter } from './routes/merchant';
import { adminRouter } from './routes/admin';
import { reviewRouter } from './routes/reviews';
import { accountRouter } from './routes/account';

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(express.json({ limit: '8mb' }));
  if (env.corsOrigins.length) {
    app.use(cors({ origin: env.corsOrigins }));
  }

  // Global modest rate limit, with a tighter limit on auth endpoints.
  const globalLimiter = rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  const authLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de tentatives, réessayez plus tard', code: 'RATE_LIMITED' },
  });
  app.use(globalLimiter);

  // Uploaded shop photos (public, immutable file names).
  app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d', immutable: true }));

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'pupputgate', time: new Date().toISOString() }));

  app.use('/auth', authLimiter, authRouter);
  app.use('/', catalogRouter);
  app.use('/businesses', businessRouter);
  app.use('/appointments', appointmentRouter);
  app.use('/orders', orderRouter);
  app.use('/requests', requestRouter);
  app.use('/activity', activityRouter);
  app.use('/merchant', merchantRouter);
  app.use('/admin', adminRouter);
  app.use('/reviews', reviewRouter);
  app.use('/account', accountRouter);

  app.use((_req, res) => res.status(404).json({ error: 'Route introuvable', code: 'NOT_FOUND' }));
  app.use(errorMiddleware);

  return app;
}
