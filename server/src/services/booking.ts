import { DateTime } from 'luxon';
import { prisma } from '../prisma';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors';
import { generateSlots, TUNIS } from '../lib/time';
import { withSerializationRetry } from './retry';

export interface BookAppointmentInput {
  customerId: string;
  businessId: string;
  serviceId: string;
  startIso: string;
  note?: string | null;
}

/**
 * Create an appointment with transactional capacity enforcement.
 * The requested start must correspond to a currently-available generated slot.
 */
export async function bookAppointment(input: BookAppointmentInput) {
  const start = new Date(input.startIso);
  if (Number.isNaN(start.getTime())) throw badRequest('Date invalide');
  if (start.getTime() <= Date.now()) throw badRequest('Ce créneau est déjà passé');

  return withSerializationRetry(() =>
    prisma.$transaction(
      async (tx) => {
        const business = await tx.business.findUnique({
          where: { id: input.businessId },
          include: { openingHours: true },
        });
        if (!business) throw notFound('Commerce introuvable');
        if (business.status !== 'APPROVED')
          throw forbidden("Ce commerce n'est pas disponible");
        if (!business.modes.includes('APPOINTMENT'))
          throw badRequest('Ce commerce ne propose pas de rendez-vous');
        if (!business.acceptingBookings)
          throw conflict('Les réservations sont momentanément suspendues', 'BOOKINGS_PAUSED');

        const service = await tx.service.findFirst({
          where: { id: input.serviceId, businessId: business.id, active: true },
        });
        if (!service) throw notFound('Service introuvable');

        const end = new Date(start.getTime() + service.durationMin * 60_000);

        // Day window (local Tunis day) for exception + existing-booking lookup.
        const localDate = DateTime.fromJSDate(start).setZone(TUNIS).toFormat('yyyy-MM-dd');
        const dayStart = DateTime.fromISO(localDate, { zone: TUNIS }).toUTC().toJSDate();
        const dayEnd = DateTime.fromISO(localDate, { zone: TUNIS })
          .plus({ days: 1 })
          .toUTC()
          .toJSDate();

        const exception = await tx.scheduleException.findFirst({
          where: {
            businessId: business.id,
            date: DateTime.fromISO(localDate, { zone: 'utc' }).toJSDate(),
            closed: true,
          },
        });

        const existing = await tx.appointment.findMany({
          where: {
            businessId: business.id,
            status: { in: ['PENDING', 'CONFIRMED'] },
            startAt: { gte: dayStart, lt: dayEnd },
          },
          select: { startAt: true, endAt: true },
        });

        // Recompute availability; the chosen start must be an available slot.
        const slots = generateSlots({
          dateLocal: localDate,
          durationMin: service.durationMin,
          stepMin: business.slotStepMin,
          capacity: business.capacityPerSlot,
          hours: business.openingHours,
          exceptionClosed: !!exception,
          bookings: existing,
        });
        const match = slots.find((s) => s.startIso === start.toISOString());
        if (!match) throw badRequest("Ce créneau n'est pas proposé", );
        if (!match.available)
          throw conflict('Ce créneau vient d’être pris', 'SLOT_TAKEN');

        // Final overlap guard inside the serializable transaction.
        const overlap = existing.filter(
          (b) => b.startAt < end && b.endAt > start,
        ).length;
        if (overlap >= business.capacityPerSlot)
          throw conflict('Ce créneau vient d’être pris', 'SLOT_TAKEN');

        return tx.appointment.create({
          data: {
            businessId: business.id,
            customerId: input.customerId,
            serviceId: service.id,
            startAt: start,
            endAt: end,
            durationMin: service.durationMin,
            priceMillimes: service.priceMillimes,
            note: input.note ?? null,
            status: 'PENDING',
          },
          include: { business: true, service: true },
        });
      },
      { isolationLevel: 'Serializable' },
    ),
  );
}
