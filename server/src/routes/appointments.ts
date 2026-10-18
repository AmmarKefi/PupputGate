import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { asyncHandler, forbidden, notFound } from '../lib/errors';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { bookAppointment } from '../services/booking';
import { assertAppointmentTransition } from '../services/transitions';
import { serializeAppointment } from '../lib/serialize';
import { logSimulatedReminder } from '../services/notify';

export const appointmentRouter = Router();

const createSchema = z.object({
  businessId: z.string().min(1),
  serviceId: z.string().min(1),
  startIso: z.string().datetime(),
  note: z.string().trim().max(500).optional(),
});

appointmentRouter.post(
  '/',
  requireAuth,
  requireRole('CUSTOMER', 'MERCHANT'),
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>;
    const appt = await bookAppointment({
      customerId: req.user!.id,
      businessId: body.businessId,
      serviceId: body.serviceId,
      startIso: body.startIso,
      note: body.note ?? null,
    });
    await logSimulatedReminder(appt.businessId, req.user!.phone ?? '', 'appointment_requested');
    res.status(201).json({ appointment: serializeAppointment(appt) });
  }),
);

appointmentRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const appts = await prisma.appointment.findMany({
      where: { customerId: req.user!.id },
      include: { business: true, service: true },
      orderBy: { startAt: 'desc' },
    });
    res.json({ appointments: appts.map(serializeAppointment) });
  }),
);

appointmentRouter.post(
  '/:id/cancel',
  requireAuth,
  asyncHandler(async (req, res) => {
    const appt = await prisma.appointment.findUnique({ where: { id: req.params.id as string } });
    if (!appt) throw notFound('Rendez-vous introuvable');
    if (appt.customerId !== req.user!.id) throw forbidden();
    assertAppointmentTransition(appt.status, 'CANCELLED');
    const updated = await prisma.appointment.update({
      where: { id: appt.id },
      data: { status: 'CANCELLED' },
      include: { business: true, service: true },
    });
    res.json({ appointment: serializeAppointment(updated) });
  }),
);
