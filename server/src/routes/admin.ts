import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, badRequest, forbidden, notFound } from '../lib/errors';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { serializeBusinessSummary, serializeUser } from '../lib/serialize';
import { notifyUser } from '../services/notify';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('ADMIN'));

async function audit(actorId: string, action: string, target?: string, meta?: object) {
  await prisma.auditEvent.create({ data: { actorId, action, target: target ?? null, meta: meta ?? undefined } }).catch(() => {});
}

adminRouter.get(
  '/overview',
  asyncHandler(async (req, res) => {
    const [users, businesses, pendingBiz, appts, orders, requests, reportedReviews] =
      await Promise.all([
        prisma.user.count(),
        prisma.business.count(),
        prisma.business.count({ where: { status: 'PENDING' } }),
        prisma.appointment.count(),
        prisma.order.count(),
        prisma.serviceRequest.count(),
        prisma.review.count({ where: { status: 'REPORTED' } }),
      ]);
    res.json({
      kpis: {
        users,
        businesses,
        pendingBusinesses: pendingBiz,
        appointments: appts,
        orders,
        serviceRequests: requests,
        reportedReviews,
      },
    });
  }),
);

const statusQuery = z.object({ status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).optional() });
adminRouter.get(
  '/businesses',
  asyncHandler(async (req, res) => {
    const parsed = statusQuery.safeParse(req.query);
    if (!parsed.success) throw badRequest('Paramètres invalides');
    const businesses = await prisma.business.findMany({
      where: parsed.data.status ? { status: parsed.data.status } : {},
      include: { category: true, zone: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ businesses: businesses.map((b) => serializeBusinessSummary(b)) });
  }),
);

const NOTICE_KEYS = {
  approve: { title: 'notif.bizApproved.title', body: 'notif.bizApproved.body' },
  reject: { title: 'notif.bizRejected.title', body: 'notif.bizRejected.body' },
  suspend: { title: 'notif.bizSuspended.title', body: 'notif.bizSuspended.body' },
  reactivate: { title: 'notif.bizApproved.title', body: 'notif.bizApproved.body' },
} as const;

function bizAction(action: 'approve' | 'reject' | 'suspend' | 'reactivate') {
  const statusMap = {
    approve: 'APPROVED',
    reject: 'REJECTED',
    suspend: 'SUSPENDED',
    reactivate: 'APPROVED',
  } as const;
  return asyncHandler(async (req, res) => {
    const business = await prisma.business.findUnique({ where: { id: req.params.id as string } });
    if (!business) throw notFound('Commerce introuvable');
    const updated = await prisma.business.update({
      where: { id: business.id },
      data: { status: statusMap[action] },
    });
    await audit(req.user!.id, `business.${action}`, business.id);
    // Persisted in-app notice to every owner of the business about the decision.
    const owners = await prisma.membership.findMany({
      where: { businessId: business.id },
      select: { userId: true },
    });
    const notice = NOTICE_KEYS[action];
    await Promise.all(
      owners.map((o) => notifyUser(o.userId, notice.title, notice.body, { businessId: business.id })),
    );
    res.json({ business: serializeBusinessSummary(updated) });
  });
}
adminRouter.post('/businesses/:id/approve', bizAction('approve'));
adminRouter.post('/businesses/:id/reject', bizAction('reject'));
adminRouter.post('/businesses/:id/suspend', bizAction('suspend'));
adminRouter.post('/businesses/:id/reactivate', bizAction('reactivate'));

adminRouter.get(
  '/users',
  asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
    res.json({ users: users.map(serializeUser) });
  }),
);

adminRouter.post(
  '/users/:id/suspend',
  asyncHandler(async (req, res) => {
    // Guard: an admin cannot suspend their own account via this interface.
    if (req.params.id as string === req.user!.id)
      throw forbidden('Vous ne pouvez pas suspendre votre propre compte');
    const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
    if (!user) throw notFound('Utilisateur introuvable');
    const updated = await prisma.user.update({ where: { id: user.id }, data: { suspended: true } });
    // Revoke sessions of the suspended user.
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await audit(req.user!.id, 'user.suspend', user.id);
    res.json({ user: serializeUser(updated) });
  }),
);
adminRouter.post(
  '/users/:id/reactivate',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
    if (!user) throw notFound('Utilisateur introuvable');
    const updated = await prisma.user.update({ where: { id: user.id }, data: { suspended: false } });
    await audit(req.user!.id, 'user.reactivate', user.id);
    res.json({ user: serializeUser(updated) });
  }),
);

/* ---- review moderation ---- */
const reviewStatusQuery = z.object({ status: z.enum(['PUBLISHED', 'REPORTED', 'HIDDEN']).optional() });
adminRouter.get(
  '/reviews',
  asyncHandler(async (req, res) => {
    const parsed = reviewStatusQuery.safeParse(req.query);
    if (!parsed.success) throw badRequest('Paramètres invalides');
    const reviews = await prisma.review.findMany({
      where: parsed.data.status ? { status: parsed.data.status } : {},
      include: { business: { select: { name: true } }, author: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ reviews });
  }),
);
adminRouter.post(
  '/reviews/:id/hide',
  asyncHandler(async (req, res) => {
    const review = await prisma.review.update({ where: { id: req.params.id as string }, data: { status: 'HIDDEN' } });
    await audit(req.user!.id, 'review.hide', req.params.id as string);
    res.json({ review });
  }),
);
adminRouter.post(
  '/reviews/:id/publish',
  asyncHandler(async (req, res) => {
    const review = await prisma.review.update({ where: { id: req.params.id as string }, data: { status: 'PUBLISHED' } });
    await audit(req.user!.id, 'review.publish', req.params.id as string);
    res.json({ review });
  }),
);

/* ---- category management ---- */
const categorySchema = z.object({
  slug: z.string().trim().min(1),
  nameFr: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  nameAr: z.string().trim().min(1),
  icon: z.string().trim().min(1),
  sortOrder: z.number().int().optional(),
});
adminRouter.post(
  '/categories',
  validateBody(categorySchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof categorySchema>;
    const category = await prisma.category.upsert({
      where: { slug: body.slug },
      create: body,
      update: body,
    });
    res.status(201).json({ category });
  }),
);
