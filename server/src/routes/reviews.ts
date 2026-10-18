import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, badRequest, notFound } from '../lib/errors';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

export const reviewRouter = Router();

async function recomputeRating(businessId: string) {
  const agg = await prisma.review.aggregate({
    where: { businessId, status: 'PUBLISHED' },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.business.update({
    where: { id: businessId },
    data: {
      ratingAvg: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
      ratingCount: agg._count._all,
    },
  });
}

reviewRouter.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const businessId = typeof req.query.businessId === 'string' ? req.query.businessId : null;
    if (!businessId) throw badRequest('businessId requis');
    const reviews = await prisma.review.findMany({
      where: { businessId, status: 'PUBLISHED' },
      include: { author: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        authorName: r.author.fullName,
        isDemo: r.isDemo,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  }),
);

const createSchema = z.object({
  businessId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(600).optional(),
});
reviewRouter.post(
  '/',
  requireAuth,
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    const business = await prisma.business.findUnique({ where: { id: body.businessId } });
    if (!business) throw notFound('Commerce introuvable');
    const review = await prisma.review.create({
      data: {
        businessId: body.businessId,
        authorId: req.user!.id,
        rating: body.rating,
        comment: body.comment ?? null,
        status: 'PUBLISHED',
        isDemo: false,
      },
    });
    await recomputeRating(body.businessId);
    res.status(201).json({ review: { id: review.id } });
  }),
);

reviewRouter.post(
  '/:id/report',
  requireAuth,
  asyncHandler(async (req, res) => {
    const review = await prisma.review.findUnique({ where: { id: req.params.id as string } });
    if (!review) throw notFound('Avis introuvable');
    await prisma.review.update({ where: { id: review.id }, data: { status: 'REPORTED' } });
    res.json({ ok: true });
  }),
);
