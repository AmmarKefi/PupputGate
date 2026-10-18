import type { Request, Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';
import { prisma } from '../prisma';
import { hashToken } from '../lib/tokens';
import { forbidden, unauthorized, asyncHandler } from '../lib/errors';

export interface AuthedUser {
  id: string;
  role: Role;
  email: string;
  fullName: string;
  phone: string | null;
  locale: string;
  suspended: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthedUser;
    }
  }
}

async function resolveUser(req: Request): Promise<AuthedUser | null> {
  const header = req.header('authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  const raw = header.slice('Bearer '.length).trim();
  if (!raw) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  const u = session.user;
  return {
    id: u.id,
    role: u.role,
    email: u.email,
    fullName: u.fullName,
    phone: u.phone ?? null,
    locale: u.locale,
    suspended: u.suspended,
  };
}

/** Attaches req.user if a valid token is present; never rejects. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const user = await resolveUser(req);
  if (user && !user.suspended) req.user = user;
  next();
});

/** Rejects unless a valid, non-suspended session is present. */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const user = await resolveUser(req);
  if (!user) throw unauthorized();
  if (user.suspended) throw forbidden('Compte suspendu');
  req.user = user;
  next();
});

/** Must be used after requireAuth. */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };
}
