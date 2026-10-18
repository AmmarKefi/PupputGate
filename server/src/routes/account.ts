import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { serializeUser } from '../lib/serialize';

export const accountRouter = Router();
accountRouter.use(requireAuth);

const profileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(20).optional(),
  locale: z.enum(['fr', 'en', 'ar']).optional(),
});
accountRouter.patch(
  '/profile',
  validateBody(profileSchema),
  asyncHandler(async (req, res) => {
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: req.body as z.infer<typeof profileSchema>,
    });
    res.json({ user: serializeUser(updated) });
  }),
);

accountRouter.get(
  '/notifications',
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({
      notifications: notifications.map((n) => ({
        id: n.id,
        titleKey: n.titleKey,
        bodyKey: n.bodyKey,
        data: n.data,
        read: !!n.readAt,
        createdAt: n.createdAt.toISOString(),
      })),
      unread: notifications.filter((n) => !n.readAt).length,
    });
  }),
);

accountRouter.post(
  '/notifications/:id/read',
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { id: req.params.id as string, userId: req.user!.id },
      data: { readAt: new Date() },
    });
    res.json({ ok: true });
  }),
);
