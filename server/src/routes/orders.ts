import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, forbidden, notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createOrder, restoreStockForOrder } from '../services/ordering';
import { assertOrderTransition } from '../services/transitions';
import { serializeOrder } from '../lib/serialize';

export const orderRouter = Router();

const createSchema = z.object({
  businessId: z.string().min(1),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(50),
      }),
    )
    .min(1)
    .max(20),
  pickupIso: z.string().datetime().optional(),
  note: z.string().trim().max(500).optional(),
});

orderRouter.post(
  '/',
  requireAuth,
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    const order = await createOrder({
      customerId: req.user!.id,
      businessId: body.businessId,
      lines: body.lines,
      pickupIso: body.pickupIso ?? null,
      note: body.note ?? null,
    });
    res.status(201).json({ order: serializeOrder(order) });
  }),
);

orderRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
      where: { customerId: req.user!.id },
      include: { items: true, business: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders: orders.map(serializeOrder) });
  }),
);

orderRouter.post(
  '/:id/cancel',
  requireAuth,
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id as string } });
    if (!order) throw notFound('Commande introuvable');
    if (order.customerId !== req.user!.id) throw forbidden();
    assertOrderTransition(order.status, 'CANCELLED');
    await restoreStockForOrder(order.id);
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'CANCELLED' },
      include: { items: true, business: true },
    });
    res.json({ order: serializeOrder(updated) });
  }),
);
