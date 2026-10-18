import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, badRequest, forbidden, notFound } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { acceptQuotation, declineQuotation } from '../services/quoting';
import { assertRequestTransition } from '../services/transitions';
import { serializeServiceRequest } from '../lib/serialize';

export const requestRouter = Router();

const httpsUrl = z.string().url().refine((u) => u.startsWith('https://'), {
  message: 'Les images doivent être des URLs HTTPS',
});

const createSchema = z.object({
  businessId: z.string().min(1),
  problemType: z.string().trim().min(2).max(120),
  description: z.string().trim().min(5).max(1500),
  zoneSlug: z.string().trim().min(1),
  address: z.string().trim().max(300).optional(),
  timeWindow: z.string().trim().max(120).optional(),
  urgent: z.boolean().optional(),
  // Photo uploads are NOT implemented; only validated HTTPS image URLs accepted.
  photoUrls: z.array(httpsUrl).max(6).optional(),
});

requestRouter.post(
  '/',
  requireAuth,
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    const business = await prisma.business.findUnique({ where: { id: body.businessId } });
    if (!business || business.status !== 'APPROVED') throw notFound('Commerce introuvable');
    if (!business.modes.includes('QUOTE'))
      throw badRequest('Ce commerce ne propose pas de devis');

    const created = await prisma.serviceRequest.create({
      data: {
        businessId: business.id,
        customerId: req.user!.id,
        problemType: body.problemType,
        description: body.description,
        zoneSlug: body.zoneSlug,
        address: body.address ?? null,
        timeWindow: body.timeWindow ?? null,
        urgent: body.urgent ?? false,
        photoUrls: body.photoUrls ?? [],
        status: 'SUBMITTED',
      },
      include: { business: true, quotation: true },
    });
    // The customer always sees their own private details.
    res.status(201).json({ request: serializeServiceRequest(created, true) });
  }),
);

requestRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const requests = await prisma.serviceRequest.findMany({
      where: { customerId: req.user!.id },
      include: { business: true, quotation: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ requests: requests.map((r) => serializeServiceRequest(r, true)) });
  }),
);

requestRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: req.params.id as string },
      include: { business: { include: { memberships: true } }, quotation: true },
    });
    if (!request) throw notFound('Demande introuvable');
    const isCustomer = request.customerId === req.user!.id;
    const isMerchant = request.business.memberships.some((m) => m.userId === req.user!.id);
    const isAdmin = req.user!.role === 'ADMIN';
    if (!isCustomer && !isMerchant && !isAdmin) throw forbidden();
    res.json({
      request: serializeServiceRequest(request, isCustomer || isMerchant || isAdmin),
    });
  }),
);

requestRouter.post(
  '/:id/accept',
  requireAuth,
  asyncHandler(async (req, res) => {
    const updated = await acceptQuotation(req.user!.id, req.params.id as string);
    res.json({ request: serializeServiceRequest(updated, true) });
  }),
);

requestRouter.post(
  '/:id/decline',
  requireAuth,
  asyncHandler(async (req, res) => {
    const updated = await declineQuotation(req.user!.id, req.params.id as string);
    res.json({ request: serializeServiceRequest(updated, true) });
  }),
);

requestRouter.post(
  '/:id/cancel',
  requireAuth,
  asyncHandler(async (req, res) => {
    const request = await prisma.serviceRequest.findUnique({ where: { id: req.params.id as string } });
    if (!request) throw notFound('Demande introuvable');
    if (request.customerId !== req.user!.id) throw forbidden();
    assertRequestTransition(request.status, 'CANCELLED');
    const updated = await prisma.serviceRequest.update({
      where: { id: request.id },
      data: { status: 'CANCELLED' },
      include: { business: true, quotation: true },
    });
    res.json({ request: serializeServiceRequest(updated, true) });
  }),
);
