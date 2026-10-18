import { Router } from 'express';
import { prisma } from '../prisma';
import { asyncHandler } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import {
  serializeAppointment,
  serializeOrder,
  serializeServiceRequest,
} from '../lib/serialize';

export const activityRouter = Router();

const ACTIVE_APPT = ['PENDING', 'CONFIRMED'];
const ACTIVE_ORDER = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'];
const ACTIVE_REQ = ['SUBMITTED', 'UNDER_REVIEW', 'QUOTE_SENT', 'ACCEPTED', 'IN_PROGRESS'];

activityRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const uid = req.user!.id;
    const [appointments, orders, requests] = await Promise.all([
      prisma.appointment.findMany({
        where: { customerId: uid },
        include: { business: true, service: true },
        orderBy: { startAt: 'desc' },
      }),
      prisma.order.findMany({
        where: { customerId: uid },
        include: { items: true, business: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serviceRequest.findMany({
        where: { customerId: uid },
        include: { business: true, quotation: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Determine the single most relevant active item for the floating pill.
    let active:
      | { kind: 'appointment' | 'order' | 'request'; id: string; label: string; status: string }
      | null = null;

    const readyOrder = orders.find((o) => o.status === 'READY_FOR_PICKUP');
    const activeOrder = readyOrder ?? orders.find((o) => ACTIVE_ORDER.includes(o.status));
    const nextAppt = appointments
      .filter((a) => ACTIVE_APPT.includes(a.status) && a.startAt.getTime() > Date.now())
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())[0];
    const quoteReq = requests.find((r) => r.status === 'QUOTE_SENT');

    if (readyOrder) {
      active = { kind: 'order', id: readyOrder.id, status: readyOrder.status, label: readyOrder.business.name };
    } else if (nextAppt) {
      active = { kind: 'appointment', id: nextAppt.id, status: nextAppt.status, label: nextAppt.business.name };
    } else if (quoteReq) {
      active = { kind: 'request', id: quoteReq.id, status: quoteReq.status, label: quoteReq.business.name };
    } else if (activeOrder) {
      active = { kind: 'order', id: activeOrder.id, status: activeOrder.status, label: activeOrder.business.name };
    }

    res.json({
      appointments: appointments.map(serializeAppointment),
      orders: orders.map(serializeOrder),
      requests: requests.map((r) => serializeServiceRequest(r, true)),
      counts: {
        activeAppointments: appointments.filter((a) => ACTIVE_APPT.includes(a.status)).length,
        activeOrders: orders.filter((o) => ACTIVE_ORDER.includes(o.status)).length,
        activeRequests: requests.filter((r) => ACTIVE_REQ.includes(r.status)).length,
      },
      active,
    });
  }),
);
