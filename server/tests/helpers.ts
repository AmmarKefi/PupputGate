import { prisma } from '../src/prisma';
import { hashPassword } from '../src/lib/password';

export async function resetDb() {
  await prisma.communicationLog.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favourite.deleteMany();
  await prisma.product.deleteMany();
  await prisma.service.deleteMany();
  await prisma.scheduleException.deleteMany();
  await prisma.openingHour.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.business.deleteMany();
  await prisma.session.deleteMany();
  await prisma.category.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.user.deleteMany();
}

const WEEK_ALWAYS_OPEN = Array.from({ length: 7 }, (_, weekday) => ({
  weekday,
  openMinute: 0,
  closeMinute: 1440,
}));

/** Minimal fixture used by the integration tests. */
export async function seedFixture() {
  const passwordHash = await hashPassword('Password123!');
  const [customer, customer2, merchant, artisan, admin] = await Promise.all([
    prisma.user.create({ data: { email: 'c1@test.local', fullName: 'C1', phone: '+21620000001', passwordHash, role: 'CUSTOMER' } }),
    prisma.user.create({ data: { email: 'c2@test.local', fullName: 'C2', phone: '+21620000002', passwordHash, role: 'CUSTOMER' } }),
    prisma.user.create({ data: { email: 'm1@test.local', fullName: 'M1', phone: '+21620000003', passwordHash, role: 'MERCHANT' } }),
    prisma.user.create({ data: { email: 'a1@test.local', fullName: 'A1', phone: '+21620000004', passwordHash, role: 'MERCHANT' } }),
    prisma.user.create({ data: { email: 'admin@test.local', fullName: 'Admin', phone: '+21620000005', passwordHash, role: 'ADMIN' } }),
  ]);

  const cat = await prisma.category.create({
    data: { slug: 'beaute', nameFr: 'Beauté', nameEn: 'Beauty', nameAr: 'جمال', icon: 'cut', sortOrder: 1 },
  });
  const zone = await prisma.zone.create({ data: { slug: 'medina', name: 'Médina', latitude: 36.4, longitude: 10.61 } });

  // Appointment business (capacity 1, open 24h for deterministic slot tests).
  const barber = await prisma.business.create({
    data: {
      slug: 'barber', name: 'Barber', categoryId: cat.id, zoneId: zone.id,
      primaryMode: 'APPOINTMENT', modes: ['APPOINTMENT'], status: 'APPROVED',
      capacityPerSlot: 1, slotStepMin: 30, latitude: 36.4, longitude: 10.61,
      openingHours: { create: WEEK_ALWAYS_OPEN },
      services: { create: { name: 'Coupe', durationMin: 30, priceMillimes: 15000, sortOrder: 0 } },
    },
    include: { services: true },
  });
  await prisma.membership.create({ data: { userId: merchant.id, businessId: barber.id } });

  // Showcase business with a unique piece and an in-stock product.
  const dar = await prisma.business.create({
    data: {
      slug: 'dar', name: 'Dar', categoryId: cat.id, zoneId: zone.id,
      primaryMode: 'SHOWCASE', modes: ['SHOWCASE', 'ORDER'], status: 'APPROVED',
      latitude: 36.4, longitude: 10.61,
      openingHours: { create: WEEK_ALWAYS_OPEN },
      products: {
        create: [
          { name: 'Tapis unique', priceMillimes: 450000, stockStatus: 'UNIQUE_PIECE', stockQty: 1, sortOrder: 0 },
          { name: 'Assiette', priceMillimes: 35000, stockStatus: 'IN_STOCK', stockQty: 2, sortOrder: 1 },
        ],
      },
    },
    include: { products: true },
  });
  await prisma.membership.create({ data: { userId: artisan.id, businessId: dar.id } });

  // Quote business (home service, hidden location).
  const plumber = await prisma.business.create({
    data: {
      slug: 'plumber', name: 'Plumber', categoryId: cat.id, zoneId: zone.id,
      primaryMode: 'QUOTE', modes: ['QUOTE'], status: 'APPROVED',
      hideExactLocation: true, serviceArea: 'Hammamet',
      openingHours: { create: WEEK_ALWAYS_OPEN },
    },
  });
  await prisma.membership.create({ data: { userId: merchant.id, businessId: plumber.id } });

  return {
    customer, customer2, merchant, artisan, admin, barber, dar, plumber,
    service: barber.services[0]!,
    unique: dar.products.find((p) => p.stockStatus === 'UNIQUE_PIECE')!,
    inStock: dar.products.find((p) => p.stockStatus === 'IN_STOCK')!,
  };
}

/** Next 30-min-aligned slot start at least 1h in the future (business open 24h). */
export function futureSlotIso(hoursAhead = 2): string {
  const d = new Date(Date.now() + hoursAhead * 3600_000);
  d.setUTCMinutes(d.getUTCMinutes() < 30 ? 0 : 30, 0, 0);
  return d.toISOString();
}
