import { Router } from 'express';
import { z } from 'zod';
import { DateTime } from 'luxon';
import type { Prisma, CommerceMode } from '@prisma/client';
import { prisma } from '../prisma';
import { asyncHandler, badRequest, notFound } from '../lib/errors';
import { optionalAuth, requireAuth } from '../middleware/auth';
import {
  serializeBusinessDetail,
  serializeBusinessSummary,
} from '../lib/serialize';
import { distanceKm } from '../lib/geo';
import {
  generateSlots,
  nextOpenLabel,
  upcomingDates,
  TUNIS,
} from '../lib/time';

export const businessRouter = Router();

const listQuery = z.object({
  q: z.string().trim().optional(),
  mode: z.enum(['APPOINTMENT', 'ORDER', 'SHOWCASE', 'QUOTE']).optional(),
  category: z.string().trim().optional(),
  zone: z.string().trim().optional(),
  availableNow: z.enum(['true', 'false']).optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  sort: z.enum(['rating', 'distance', 'name']).optional(),
  featured: z.enum(['true', 'false']).optional(),
});

function isOpenNow(hours: { weekday: number; openMinute: number | null; closeMinute: number | null }[]): boolean {
  const now = DateTime.now().setZone(TUNIS);
  const weekday = now.weekday % 7;
  const row = hours.find((h) => h.weekday === weekday);
  if (!row || row.openMinute == null || row.closeMinute == null) return false;
  const mins = now.hour * 60 + now.minute;
  return mins >= row.openMinute && mins < row.closeMinute;
}

businessRouter.get(
  '/',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const parsed = listQuery.safeParse(req.query);
    if (!parsed.success) throw badRequest('Paramètres invalides', parsed.error.flatten());
    const q = parsed.data;

    const where: Prisma.BusinessWhereInput = { status: 'APPROVED' };
    if (q.mode) where.modes = { has: q.mode as CommerceMode };
    if (q.category) where.category = { slug: q.category };
    if (q.zone) where.zone = { slug: q.zone };
    if (q.q) {
      where.OR = [
        { name: { contains: q.q, mode: 'insensitive' } },
        { shortDescription: { contains: q.q, mode: 'insensitive' } },
        { description: { contains: q.q, mode: 'insensitive' } },
        { services: { some: { name: { contains: q.q, mode: 'insensitive' } } } },
        { products: { some: { name: { contains: q.q, mode: 'insensitive' } } } },
      ];
    }

    const businesses = await prisma.business.findMany({
      where,
      include: {
        category: true,
        zone: true,
        services: { where: { active: true }, select: { priceMillimes: true } },
        products: { where: { active: true }, select: { priceMillimes: true } },
        openingHours: true,
      },
      take: 100,
    });

    let favouriteIds: Set<string> | undefined;
    if (req.user) {
      const favs = await prisma.favourite.findMany({
        where: { userId: req.user.id },
        select: { businessId: true },
      });
      favouriteIds = new Set(favs.map((f) => f.businessId));
    }

    let results = businesses.map((b) => {
      const dist =
        q.lat != null && q.lng != null && b.latitude != null && b.longitude != null && !b.hideExactLocation
          ? distanceKm(q.lat, q.lng, b.latitude, b.longitude)
          : null;
      const nextSlotLabel = b.modes.includes('APPOINTMENT')
        ? nextOpenLabel(b.openingHours)
        : null;
      return {
        raw: b,
        dto: serializeBusinessSummary(b, { favouriteIds, distanceKm: dist, nextSlotLabel }),
      };
    });

    if (q.availableNow === 'true') {
      results = results.filter(
        (r) => r.raw.acceptingBookings && isOpenNow(r.raw.openingHours),
      );
    }

    if (q.sort === 'rating') {
      results.sort((a, b) => (b.dto.ratingAvg ?? 0) - (a.dto.ratingAvg ?? 0));
    } else if (q.sort === 'distance') {
      results.sort(
        (a, b) => (a.dto.distanceKm ?? Infinity) - (b.dto.distanceKm ?? Infinity),
      );
    } else if (q.sort === 'name') {
      results.sort((a, b) => a.dto.name.localeCompare(b.dto.name));
    } else {
      // default: rating desc with review count as tiebreaker
      results.sort(
        (a, b) =>
          (b.dto.ratingAvg ?? 0) - (a.dto.ratingAvg ?? 0) ||
          b.dto.ratingCount - a.dto.ratingCount,
      );
    }

    const data = results.map((r) => r.dto);
    res.json({ businesses: q.featured === 'true' ? data.slice(0, 6) : data });
  }),
);

businessRouter.get(
  '/:slug',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const business = await prisma.business.findUnique({
      where: { slug: req.params.slug as string },
      include: {
        category: true,
        zone: true,
        openingHours: { orderBy: { weekday: 'asc' } },
        services: { where: { active: true }, orderBy: { sortOrder: 'asc' } },
        products: { where: { active: true }, orderBy: { sortOrder: 'asc' } },
        photos: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!business) throw notFound('Commerce introuvable');
    // Non-approved businesses are visible only to their own owners (merchant preview).
    if (business.status !== 'APPROVED') {
      const owner = req.user
        ? await prisma.membership.findFirst({ where: { businessId: business.id, userId: req.user.id } })
        : null;
      if (!owner) throw notFound('Commerce introuvable');
    }

    let favouriteIds: Set<string> | undefined;
    if (req.user) {
      const favs = await prisma.favourite.findMany({
        where: { userId: req.user.id },
        select: { businessId: true },
      });
      favouriteIds = new Set(favs.map((f) => f.businessId));


    }
    const nextSlotLabel = business.modes.includes('APPOINTMENT')
      ? nextOpenLabel(business.openingHours)
      : null;
    res.json({ business: serializeBusinessDetail(business, { favouriteIds, nextSlotLabel }) });
  }),
);

const slotsQuery = z.object({
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  days: z.coerce.number().min(1).max(7).optional(),
});

businessRouter.get(
  '/:id/slots',
  asyncHandler(async (req, res) => {
    const parsed = slotsQuery.safeParse(req.query);
    if (!parsed.success) throw badRequest('Paramètres invalides', parsed.error.flatten());
    const { serviceId } = parsed.data;

    const business = await prisma.business.findUnique({
      where: { id: req.params.id as string },
      include: { openingHours: true },
    });
    if (!business || business.status !== 'APPROVED') throw notFound('Commerce introuvable');
    const service = await prisma.service.findFirst({
      where: { id: serviceId, businessId: business.id, active: true },
    });
    if (!service) throw notFound('Service introuvable');

    const dates = parsed.data.date ? [parsed.data.date] : upcomingDates(parsed.data.days ?? 7);

    // Fetch active bookings across the window once.
    const windowStart = DateTime.fromISO(dates[0]!, { zone: TUNIS }).toUTC().toJSDate();
    const windowEnd = DateTime.fromISO(dates[dates.length - 1]!, { zone: TUNIS })
      .plus({ days: 1 })
      .toUTC()
      .toJSDate();
    const [bookings, exceptions] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          businessId: business.id,
          status: { in: ['PENDING', 'CONFIRMED'] },
          startAt: { gte: windowStart, lt: windowEnd },
        },
        select: { startAt: true, endAt: true },
      }),
      prisma.scheduleException.findMany({
        where: { businessId: business.id, closed: true },
        select: { date: true },
      }),
    ]);
    const closedDates = new Set(
      exceptions.map((e) => DateTime.fromJSDate(e.date).toUTC().toFormat('yyyy-MM-dd')),
    );

    const days = dates.map((dateLocal) => ({
      date: dateLocal,
      slots: generateSlots({
        dateLocal,
        durationMin: service.durationMin,
        stepMin: business.slotStepMin,
        capacity: business.capacityPerSlot,
        hours: business.openingHours,
        exceptionClosed: closedDates.has(dateLocal),
        bookings,
      }),
    }));

    res.json({ serviceId, durationMin: service.durationMin, days });
  }),
);

businessRouter.post(
  '/:id/favourite',
  requireAuth,
  asyncHandler(async (req, res) => {
    const business = await prisma.business.findUnique({ where: { id: req.params.id as string } });
    if (!business) throw notFound('Commerce introuvable');
    await prisma.favourite.upsert({
      where: { userId_businessId: { userId: req.user!.id, businessId: business.id } },
      create: { userId: req.user!.id, businessId: business.id },
      update: {},
    });
    res.status(201).json({ favourite: true });
  }),
);

businessRouter.delete(
  '/:id/favourite',
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.favourite.deleteMany({
      where: { userId: req.user!.id, businessId: req.params.id as string },
    });
    res.json({ favourite: false });
  }),
);

businessRouter.get(
  '/me/favourites',
  requireAuth,
  asyncHandler(async (req, res) => {
    const favs = await prisma.favourite.findMany({
      where: { userId: req.user!.id },
      include: {
        business: {
          include: {
            category: true,
            zone: true,
            services: { where: { active: true }, select: { priceMillimes: true } },
            products: { where: { active: true }, select: { priceMillimes: true } },
          },
        },
      },
    });
    const favIds = new Set(favs.map((f) => f.businessId));
    res.json({
      businesses: favs.map((f) =>
        serializeBusinessSummary(f.business, { favouriteIds: favIds }),
      ),
    });
  }),
);
