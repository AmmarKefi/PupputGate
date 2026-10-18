import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, conflict, unauthorized, forbidden } from '../lib/errors';
import { hashPassword, verifyPassword } from '../lib/password';
import { generateRawToken, hashToken, tokenExpiry } from '../lib/tokens';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { serializeUser } from '../lib/serialize';

export const authRouter = Router();

const tunisianPhone = z
  .string()
  .trim()
  .regex(/^(\+?216)?[2-9]\d{7}$/, 'Numéro de téléphone tunisien invalide');

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  phone: tunisianPhone,
  password: z.string().min(8).max(200),
  // Role is restricted here: a user can NEVER self-register as ADMIN.
  role: z.enum(['CUSTOMER', 'MERCHANT']).default('CUSTOMER'),
  locale: z.enum(['fr', 'en', 'ar']).default('fr'),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

async function issueSession(userId: string) {
  const raw = generateRawToken();
  const session = await prisma.session.create({
    data: { tokenHash: hashToken(raw), userId, expiresAt: tokenExpiry() },
  });
  return { token: raw, expiresAt: session.expiresAt.toISOString() };
}

authRouter.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof registerSchema>;
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw conflict('Un compte existe déjà avec cet email', 'EMAIL_TAKEN');

    const user = await prisma.user.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        passwordHash: await hashPassword(body.password),
        role: body.role,
        locale: body.locale,
      },
    });
    const session = await issueSession(user.id);
    res.status(201).json({ ...session, user: serializeUser(user) });
  }),
);

authRouter.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof loginSchema>;
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    // Constant-ish path: always run a compare to reduce user-enumeration signal.
    const ok = user
      ? await verifyPassword(body.password, user.passwordHash)
      : await verifyPassword(body.password, '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidin');
    if (!user || !ok) throw unauthorized('Email ou mot de passe incorrect');
    if (user.suspended) throw forbidden('Ce compte est suspendu');

    const session = await issueSession(user.id);
    res.json({ ...session, user: serializeUser(user) });
  }),
);

authRouter.post(
  '/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    const header = req.header('authorization') ?? '';
    const raw = header.slice('Bearer '.length).trim();
    if (raw) {
      await prisma.session.deleteMany({ where: { tokenHash: hashToken(raw) } });
    }
    res.status(204).end();
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw unauthorized();
    res.json({ user: serializeUser(user) });
  }),
);
