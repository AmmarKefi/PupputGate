import { Router } from 'express';
import { prisma } from '../prisma';
import { asyncHandler } from '../lib/errors';

export const catalogRouter = Router();

catalogRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json({ categories });
  }),
);

catalogRouter.get(
  '/zones',
  asyncHandler(async (_req, res) => {
    const zones = await prisma.zone.findMany({ orderBy: { name: 'asc' } });
    res.json({ zones });
  }),
);
