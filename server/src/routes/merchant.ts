import { Router } from 'express';
import { z } from 'zod';
import { DateTime } from 'luxon';
import { prisma } from '../prisma';
import { asyncHandler, badRequest, forbidden, notFound } from '../lib/errors';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  serializeAppointment,
  serializeBusinessDetail,
  serializeOrder,
  serializeServiceRequest,
} from '../lib/serialize';
import { assertAppointmentTransition, assertOrderTransition, assertRequestTransition } from '../services/transitions';
import { restoreStockForOrder } from '../services/ordering';
import { submitQuotation } from '../services/quoting';
import { logSimulatedReminder, notifyUser } from '../services/notify';
import { TUNIS } from '../lib/time';
import { deleteImage, saveImage } from '../lib/images';
import { env } from '../env';

export const merchantRouter = Router();
merchantRouter.use(requireAuth, requireRole('MERCHANT', 'ADMIN'));

async function assertOwns(userId: string, businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { memberships: true },
  });
  if (!business) throw notFound('Commerce introuvable');
  if (!business.memberships.some((m) => m.userId === userId))
    throw forbidden('Vous ne gérez pas ce commerce');
  return business;
}

async function assertOwnsVia(userId: string, businessId: string) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, memberships: { some: { userId } } },
  });
  if (!business) throw forbidden();
  return business;
}

/* ---- businesses owned by this merchant ---- */
merchantRouter.get(
  '/businesses',
  asyncHandler(async (req, res) => {
    const businesses = await prisma.business.findMany({
      where: { memberships: { some: { userId: req.user!.id } } },
      include: {
        category: true,
        zone: true,
        openingHours: { orderBy: { weekday: 'asc' } },
        services: { orderBy: { sortOrder: 'asc' } },
        products: { orderBy: { sortOrder: 'asc' } },
        photos: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ businesses: businesses.map((b) => serializeBusinessDetail(b)) });
  }),
);

/* ---- 4-step onboarding: creates a PENDING business ---- */
const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(120),
  categorySlug: z.string().trim().min(1),
  zoneSlug: z.string().trim().min(1),
  primaryMode: z.enum(['APPOINTMENT', 'ORDER', 'SHOWCASE', 'QUOTE']),
  modes: z.array(z.enum(['APPOINTMENT', 'ORDER', 'SHOWCASE', 'QUOTE'])).min(1),
  shortDescription: z.string().trim().max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(300).optional(),
  serviceArea: z.string().trim().max(200).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  hideExactLocation: z.boolean().optional(),
  capacityPerSlot: z.number().int().min(1).max(50).optional(),
  coverImage: z.string().trim().optional(),
});

merchantRouter.post(
  '/onboarding',
  validateBody(onboardingSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof onboardingSchema>;
    const [category, zone] = await Promise.all([
      prisma.category.findUnique({ where: { slug: body.categorySlug } }),
      prisma.zone.findUnique({ where: { slug: body.zoneSlug } }),
    ]);
    if (!category) throw badRequest('Catégorie inconnue');
    if (!zone) throw badRequest('Zone inconnue');
    if (!body.modes.includes(body.primaryMode))
      throw badRequest('Le mode principal doit faire partie des modes');

    const slugBase = body.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`;

    const business = await prisma.$transaction(async (tx) => {
      const b = await tx.business.create({
        data: {
          slug,
          name: body.name,
          categoryId: category.id,
          zoneId: zone.id,
          primaryMode: body.primaryMode,
          modes: body.modes,
          coverImage: body.coverImage ?? null,
          shortDescription: body.shortDescription ?? null,
          description: body.description ?? null,
          phone: body.phone ?? null,
          address: body.address ?? null,
          serviceArea: body.serviceArea ?? null,
          latitude: body.latitude ?? zone.latitude + (Math.random() - 0.5) * 0.005,
          longitude: body.longitude ?? zone.longitude + (Math.random() - 0.5) * 0.005,
          hideExactLocation: body.hideExactLocation ?? false,
          capacityPerSlot: body.capacityPerSlot ?? 1,
          status: env.autoApproveBusinesses ? 'APPROVED' : 'PENDING',
          isDemo: false,
        },
      });
      await tx.membership.create({ data: { userId: req.user!.id, businessId: b.id, isOwner: true } });
      // Sensible default hours: Sun closed, Mon–Sat 09:00–18:00.
      await tx.openingHour.createMany({
        data: Array.from({ length: 7 }, (_, weekday) => ({
          businessId: b.id,
          weekday,
          openMinute: weekday === 0 ? null : 9 * 60,
          closeMinute: weekday === 0 ? null : 18 * 60,
        })),
      });
      return b;
    });
    await notifyUser(req.user!.id, 'notif.bizSubmitted.title', 'notif.bizSubmitted.body', { businessId: business.id });
    res.status(201).json({ businessId: business.id, status: business.status });
  }),
);

/* ---- dashboard overview ---- */
merchantRouter.get(
  '/businesses/:id/dashboard',
  asyncHandler(async (req, res) => {
    const business = await assertOwns(req.user!.id, req.params.id as string);
    const startOfDay = DateTime.now().setZone(TUNIS).startOf('day').toUTC().toJSDate();
    const endOfDay = DateTime.now().setZone(TUNIS).endOf('day').toUTC().toJSDate();

    const [todaysAppts, pendingAppts, actionOrders, newRequests] = await Promise.all([
      prisma.appointment.findMany({
        where: { businessId: business.id, startAt: { gte: startOfDay, lte: endOfDay }, status: { in: ['PENDING', 'CONFIRMED'] } },
        include: { business: true, service: true },
        orderBy: { startAt: 'asc' },
      }),
      prisma.appointment.count({ where: { businessId: business.id, status: 'PENDING' } }),
      prisma.order.findMany({
        where: { businessId: business.id, status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } },
        include: { items: true, business: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.serviceRequest.findMany({
        where: { businessId: business.id, status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
        include: { business: true, quotation: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    res.json({
      business: { id: business.id, name: business.name, status: business.status, acceptingBookings: business.acceptingBookings },
      todaysAppointments: todaysAppts.map(serializeAppointment),
      pendingAppointmentCount: pendingAppts,
      ordersNeedingAction: actionOrders.map(serializeOrder),
      newRequests: newRequests.map((r) => serializeServiceRequest(r, true)),
    });
  }),
);

/* ---- lists ---- */
merchantRouter.get(
  '/businesses/:id/appointments',
  asyncHandler(async (req, res) => {
    await assertOwns(req.user!.id, req.params.id as string);
    const appts = await prisma.appointment.findMany({
      where: { businessId: req.params.id as string },
      include: { business: true, service: true },
      orderBy: { startAt: 'desc' },
    });
    res.json({ appointments: appts.map(serializeAppointment) });
  }),
);

merchantRouter.get(
  '/businesses/:id/orders',
  asyncHandler(async (req, res) => {
    await assertOwns(req.user!.id, req.params.id as string);
    const orders = await prisma.order.findMany({
      where: { businessId: req.params.id as string },
      include: { items: true, business: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders: orders.map(serializeOrder) });
  }),
);

merchantRouter.get(
  '/businesses/:id/requests',
  asyncHandler(async (req, res) => {
    await assertOwns(req.user!.id, req.params.id as string);
    const requests = await prisma.serviceRequest.findMany({
      where: { businessId: req.params.id as string },
      include: { business: true, quotation: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ requests: requests.map((r) => serializeServiceRequest(r, true)) });
  }),
);

merchantRouter.get(
  '/businesses/:id/communications',
  asyncHandler(async (req, res) => {
    await assertOwns(req.user!.id, req.params.id as string);
    const logs = await prisma.communicationLog.findMany({
      where: { businessId: req.params.id as string },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ simulated: true, logs });
  }),
);

/* ---- one-tap transitions ---- */
const apptTransition = z.object({ to: z.enum(['CONFIRMED', 'REJECTED', 'COMPLETED', 'NO_SHOW']) });
merchantRouter.post(
  '/appointments/:id/transition',
  validateBody(apptTransition),
  asyncHandler(async (req, res) => {
    const appt = await prisma.appointment.findUnique({ where: { id: req.params.id as string } });
    if (!appt) throw notFound('Rendez-vous introuvable');
    await assertOwnsVia(req.user!.id, appt.businessId);
    const to = (req.body as z.infer<typeof apptTransition>).to;
    assertAppointmentTransition(appt.status, to);
    const updated = await prisma.appointment.update({
      where: { id: appt.id },
      data: { status: to },
      include: { business: true, service: true },
    });
    if (to === 'CONFIRMED') {
      await logSimulatedReminder(appt.businessId, '', 'appointment_confirmed');
      await notifyUser(appt.customerId, 'notif.apptConfirmed.title', 'notif.apptConfirmed.body', { appointmentId: appt.id });
    }
    res.json({ appointment: serializeAppointment(updated) });
  }),
);

const orderTransition = z.object({
  to: z.enum(['CONFIRMED', 'REJECTED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED']),
});
merchantRouter.post(
  '/orders/:id/transition',
  validateBody(orderTransition),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.params.id as string } });
    if (!order) throw notFound('Commande introuvable');
    await assertOwnsVia(req.user!.id, order.businessId);
    const to = (req.body as z.infer<typeof orderTransition>).to;
    assertOrderTransition(order.status, to);
    if (to === 'REJECTED') await restoreStockForOrder(order.id);
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: to },
      include: { items: true, business: true },
    });
    if (to === 'READY_FOR_PICKUP') {
      await logSimulatedReminder(order.businessId, '', 'order_ready');
      await notifyUser(order.customerId, 'notif.orderReady.title', 'notif.orderReady.body', { orderId: order.id });
    }
    res.json({ order: serializeOrder(updated) });
  }),
);

const reqTransition = z.object({ to: z.enum(['UNDER_REVIEW', 'IN_PROGRESS', 'COMPLETED', 'DECLINED']) });
merchantRouter.post(
  '/requests/:id/transition',
  validateBody(reqTransition),
  asyncHandler(async (req, res) => {
    const request = await prisma.serviceRequest.findUnique({ where: { id: req.params.id as string } });
    if (!request) throw notFound('Demande introuvable');
    await assertOwnsVia(req.user!.id, request.businessId);
    const to = (req.body as z.infer<typeof reqTransition>).to;
    assertRequestTransition(request.status, to);
    const updated = await prisma.serviceRequest.update({
      where: { id: request.id },
      data: { status: to },
      include: { business: true, quotation: true },
    });
    res.json({ request: serializeServiceRequest(updated, true) });
  }),
);

const quoteSchema = z.object({
  amountMillimes: z.number().int().positive(),
  advanceMillimes: z.number().int().min(0).optional(),
  scope: z.string().trim().max(500).optional(),
  validUntilIso: z.string().datetime().optional(),
});
merchantRouter.post(
  '/requests/:id/quote',
  validateBody(quoteSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof quoteSchema>;
    const updated = await submitQuotation(req.user!.id, req.params.id as string, {
      amountMillimes: body.amountMillimes,
      advanceMillimes: body.advanceMillimes ?? null,
      scope: body.scope ?? null,
      validUntilIso: body.validUntilIso ?? null,
    });
    res.json({ request: serializeServiceRequest(updated, true) });
  }),
);

/* ---- availability pause / resume ---- */
merchantRouter.post(
  '/businesses/:id/pause',
  asyncHandler(async (req, res) => {
    await assertOwns(req.user!.id, req.params.id as string);
    await prisma.business.update({ where: { id: req.params.id as string }, data: { acceptingBookings: false } });
    res.json({ acceptingBookings: false });
  }),
);
merchantRouter.post(
  '/businesses/:id/resume',
  asyncHandler(async (req, res) => {
    await assertOwns(req.user!.id, req.params.id as string);
    await prisma.business.update({ where: { id: req.params.id as string }, data: { acceptingBookings: true } });
    res.json({ acceptingBookings: true });
  }),
);

/* ---- storefront edit ---- */
const MODE = z.enum(['APPOINTMENT', 'ORDER', 'SHOWCASE', 'QUOTE']);
/** An uploaded path (/uploads/…) or an https URL. */
const imageRef = z.string().refine((v) => v.startsWith('/uploads/') || /^https:\/\//.test(v), 'Image invalide');
const editSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  categorySlug: z.string().trim().min(1).optional(),
  zoneSlug: z.string().trim().min(1).optional(),
  primaryMode: MODE.optional(),
  modes: z.array(MODE).min(1).optional(),
  shortDescription: z.string().trim().max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().max(300).optional(),
  serviceArea: z.string().trim().max(200).optional(),
  coverImage: imageRef.optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  hideExactLocation: z.boolean().optional(),
  capacityPerSlot: z.number().int().min(1).max(50).optional(),
  slotStepMin: z
    .number()
    .int()
    .refine((v) => [15, 30, 45, 60].includes(v), 'Pas invalide')
    .optional(),
});
const FULL_INCLUDE = {
  category: true,
  zone: true,
  openingHours: { orderBy: { weekday: 'asc' as const } },
  services: { orderBy: { sortOrder: 'asc' as const } },
  products: { orderBy: { sortOrder: 'asc' as const } },
  photos: { orderBy: { sortOrder: 'asc' as const } },
};
merchantRouter.patch(
  '/businesses/:id',
  validateBody(editSchema),
  asyncHandler(async (req, res) => {
    const current = await assertOwns(req.user!.id, req.params.id as string);
    const { categorySlug, zoneSlug, ...rest } = req.body as z.infer<typeof editSchema>;
    const data: Record<string, unknown> = { ...rest };
    if (categorySlug) {
      const c = await prisma.category.findUnique({ where: { slug: categorySlug } });
      if (!c) throw badRequest('Catégorie inconnue');
      data.categoryId = c.id;
    }
    if (zoneSlug) {
      const z = await prisma.zone.findUnique({ where: { slug: zoneSlug } });
      if (!z) throw badRequest('Zone inconnue');
      data.zoneId = z.id;
    }
    const modes = rest.modes ?? current.modes;
    const primary = rest.primaryMode ?? current.primaryMode;
    if (!modes.includes(primary)) throw badRequest('Le mode principal doit faire partie des modes');
    const updated = await prisma.business.update({
      where: { id: current.id },
      data,
      include: FULL_INCLUDE,
    });
    res.json({ business: serializeBusinessDetail(updated) });
  }),
);

/* ---- photos (gallery) ---- */
const MAX_PHOTOS = 8;
const photoSchema = z.object({ data: z.string().min(100).max(7_000_000) });

merchantRouter.post(
  '/businesses/:id/photos',
  validateBody(photoSchema),
  asyncHandler(async (req, res) => {
    const business = await assertOwns(req.user!.id, req.params.id as string);
    const count = await prisma.businessPhoto.count({ where: { businessId: business.id } });
    if (count >= MAX_PHOTOS) throw badRequest(`${MAX_PHOTOS} photos maximum`);
    const url = saveImage((req.body as z.infer<typeof photoSchema>).data);
    const photo = await prisma.businessPhoto.create({ data: { businessId: business.id, url, sortOrder: count } });
    // The first photo doubles as the cover until the owner picks another.
    if (!business.coverImage) await prisma.business.update({ where: { id: business.id }, data: { coverImage: url } });
    res.status(201).json({ photo: { id: photo.id, url: photo.url }, coverImage: business.coverImage ?? url });
  }),
);

merchantRouter.post(
  '/photos/:photoId/cover',
  asyncHandler(async (req, res) => {
    const photo = await prisma.businessPhoto.findUnique({ where: { id: req.params.photoId as string } });
    if (!photo) throw notFound('Photo introuvable');
    await assertOwnsVia(req.user!.id, photo.businessId);
    await prisma.business.update({ where: { id: photo.businessId }, data: { coverImage: photo.url } });
    res.json({ coverImage: photo.url });
  }),
);

const coverSchema = z
  .object({
    data: z.string().min(100).max(7_000_000).optional(),
    url: z.string().url().optional(),
    reset: z.boolean().optional(),
  })
  .refine((v) => v.data || v.url || v.reset, 'Image requise');

merchantRouter.post(
  '/businesses/:id/cover',
  validateBody(coverSchema),
  asyncHandler(async (req, res) => {
    const business = await assertOwns(req.user!.id, req.params.id as string);
    const body = req.body as z.infer<typeof coverSchema>;
    if (body.reset) {
      const updated = await prisma.business.update({
        where: { id: business.id },
        data: { coverImage: null },
        include: FULL_INCLUDE,
      });
      return res.json({ business: serializeBusinessDetail(updated), coverImage: null });
    }
    let coverUrl: string;
    if (body.data) {
      coverUrl = saveImage(body.data);
      await prisma.businessPhoto.create({
        data: { businessId: business.id, url: coverUrl, sortOrder: 0 },
      });
    } else {
      coverUrl = body.url!;
    }
    const updated = await prisma.business.update({
      where: { id: business.id },
      data: { coverImage: coverUrl },
      include: FULL_INCLUDE,
    });
    res.json({ business: serializeBusinessDetail(updated), coverImage: coverUrl });
  }),
);

merchantRouter.delete(
  '/photos/:photoId',
  asyncHandler(async (req, res) => {
    const photo = await prisma.businessPhoto.findUnique({ where: { id: req.params.photoId as string } });
    if (!photo) throw notFound('Photo introuvable');
    const business = await assertOwnsVia(req.user!.id, photo.businessId);
    await prisma.businessPhoto.delete({ where: { id: photo.id } });
    deleteImage(photo.url);
    // If the cover was removed, fall back to the next photo (or none).
    let coverImage = business.coverImage;
    if (business.coverImage === photo.url) {
      const next = await prisma.businessPhoto.findFirst({ where: { businessId: business.id }, orderBy: { sortOrder: 'asc' } });
      coverImage = next?.url ?? null;
      await prisma.business.update({ where: { id: business.id }, data: { coverImage } });
    }
    res.json({ ok: true, coverImage });
  }),
);

/* ---- days off (calendar exceptions) ---- */
const exceptionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  closed: z.boolean().optional(),
  reason: z.string().trim().max(120).optional(),
});
merchantRouter.get(
  '/businesses/:id/exceptions',
  asyncHandler(async (req, res) => {
    await assertOwns(req.user!.id, req.params.id as string);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const rows = await prisma.scheduleException.findMany({
      where: { businessId: req.params.id as string, date: { gte: today } },
      orderBy: { date: 'asc' },
    });
    res.json({
      exceptions: rows.map((r) => ({ id: r.id, date: r.date.toISOString().slice(0, 10), closed: r.closed, reason: r.reason })),
    });
  }),
);
merchantRouter.post(
  '/businesses/:id/exceptions',
  validateBody(exceptionSchema),
  asyncHandler(async (req, res) => {
    await assertOwns(req.user!.id, req.params.id as string);
    const body = req.body as z.infer<typeof exceptionSchema>;
    const date = new Date(`${body.date}T00:00:00.000Z`);
    const row = await prisma.scheduleException.upsert({
      where: { businessId_date: { businessId: req.params.id as string, date } },
      create: { businessId: req.params.id as string, date, closed: body.closed ?? true, reason: body.reason ?? null },
      update: { closed: body.closed ?? true, reason: body.reason ?? null },
    });
    res.status(201).json({ exception: { id: row.id, date: body.date, closed: row.closed, reason: row.reason } });
  }),
);
merchantRouter.delete(
  '/exceptions/:exceptionId',
  asyncHandler(async (req, res) => {
    const row = await prisma.scheduleException.findUnique({ where: { id: req.params.exceptionId as string } });
    if (!row) throw notFound('Jour introuvable');
    await assertOwnsVia(req.user!.id, row.businessId);
    await prisma.scheduleException.delete({ where: { id: row.id } });
    res.json({ ok: true });
  }),
);

/* ---- opening hours ---- */
const hoursSchema = z.object({
  hours: z
    .array(
      z.object({
        weekday: z.number().int().min(0).max(6),
        openMinute: z.number().int().min(0).max(1440).nullable(),
        closeMinute: z.number().int().min(0).max(1440).nullable(),
      }),
    )
    .length(7),
});
merchantRouter.put(
  '/businesses/:id/hours',
  validateBody(hoursSchema),
  asyncHandler(async (req, res) => {
    await assertOwns(req.user!.id, req.params.id as string);
    const { hours } = req.body as z.infer<typeof hoursSchema>;
    await prisma.$transaction(
      hours.map((h) =>
        prisma.openingHour.upsert({
          where: { businessId_weekday: { businessId: req.params.id as string, weekday: h.weekday } },
          create: { businessId: req.params.id as string, weekday: h.weekday, openMinute: h.openMinute, closeMinute: h.closeMinute },
          update: { openMinute: h.openMinute, closeMinute: h.closeMinute },
        }),
      ),
    );
    res.json({ ok: true });
  }),
);

/* ---- services CRUD ---- */
const serviceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  durationMin: z.number().int().min(5).max(600),
  priceMillimes: z.number().int().min(0),
  active: z.boolean().optional(),
});
merchantRouter.post(
  '/businesses/:id/services',
  validateBody(serviceSchema),
  asyncHandler(async (req, res) => {
    const business = await assertOwns(req.user!.id, req.params.id as string);
    const s = await prisma.service.create({
      data: { businessId: req.params.id as string, ...(req.body as z.infer<typeof serviceSchema>) },
    });
    // Auto-enable APPOINTMENT mode if not already on the business so booking is immediately visible
    if (!business.modes.includes('APPOINTMENT')) {
      await prisma.business.update({
        where: { id: business.id },
        data: { modes: [...business.modes, 'APPOINTMENT'] },
      });
    }
    res.status(201).json({ service: s });
  }),
);
merchantRouter.patch(
  '/services/:serviceId',
  validateBody(serviceSchema.partial()),
  asyncHandler(async (req, res) => {
    const service = await prisma.service.findUnique({ where: { id: req.params.serviceId as string } });
    if (!service) throw notFound('Service introuvable');
    await assertOwnsVia(req.user!.id, service.businessId);
    const s = await prisma.service.update({ where: { id: service.id }, data: req.body as object });
    res.json({ service: s });
  }),
);
merchantRouter.delete(
  '/services/:serviceId',
  asyncHandler(async (req, res) => {
    const service = await prisma.service.findUnique({ where: { id: req.params.serviceId as string } });
    if (!service) throw notFound('Service introuvable');
    await assertOwnsVia(req.user!.id, service.businessId);
    await prisma.service.update({ where: { id: service.id }, data: { active: false } });
    res.json({ ok: true });
  }),
);

/* ---- products / stock CRUD ---- */
const productSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  priceMillimes: z.number().int().min(0),
  stockStatus: z.enum(['IN_STOCK', 'UNIQUE_PIECE', 'MADE_TO_ORDER', 'OUT_OF_STOCK']),
  stockQty: z.number().int().min(0).nullable().optional(),
  image: imageRef.optional(),
  active: z.boolean().optional(),
});
merchantRouter.post(
  '/businesses/:id/products',
  validateBody(productSchema),
  asyncHandler(async (req, res) => {
    const business = await assertOwns(req.user!.id, req.params.id as string);
    const body = req.body as z.infer<typeof productSchema>;
    const p = await prisma.product.create({
      data: {
        businessId: req.params.id as string,
        ...body,
        stockQty: body.stockStatus === 'UNIQUE_PIECE' ? 1 : body.stockQty ?? null,
      },
    });
    // Auto-enable ORDER mode if neither ORDER nor SHOWCASE is enabled so products immediately appear
    if (!business.modes.includes('ORDER') && !business.modes.includes('SHOWCASE')) {
      await prisma.business.update({
        where: { id: business.id },
        data: { modes: [...business.modes, 'ORDER'] },
      });
    }
    res.status(201).json({ product: p });
  }),
);
merchantRouter.patch(
  '/products/:productId',
  validateBody(productSchema.partial()),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: req.params.productId as string } });
    if (!product) throw notFound('Produit introuvable');
    await assertOwnsVia(req.user!.id, product.businessId);
    const p = await prisma.product.update({ where: { id: product.id }, data: req.body as object });
    res.json({ product: p });
  }),
);

merchantRouter.delete(
  '/products/:productId',
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: req.params.productId as string } });
    if (!product) throw notFound('Produit introuvable');
    await assertOwnsVia(req.user!.id, product.businessId);
    // Soft delete: past orders keep referring to it.
    await prisma.product.update({ where: { id: product.id }, data: { active: false } });
    res.json({ ok: true });
  }),
);

merchantRouter.post(
  '/products/:productId/image',
  validateBody(photoSchema),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: req.params.productId as string } });
    if (!product) throw notFound('Produit introuvable');
    await assertOwnsVia(req.user!.id, product.businessId);
    const url = saveImage((req.body as z.infer<typeof photoSchema>).data);
    deleteImage(product.image);
    await prisma.product.update({ where: { id: product.id }, data: { image: url } });
    res.json({ image: url });
  }),
);
