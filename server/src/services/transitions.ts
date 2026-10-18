import type {
  AppointmentStatus,
  OrderStatus,
  ServiceRequestStatus,
} from '@prisma/client';
import { conflict } from '../lib/errors';

const APPOINTMENT: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'NO_SHOW', 'CANCELLED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

const ORDER: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
};

const REQUEST: Record<ServiceRequestStatus, ServiceRequestStatus[]> = {
  SUBMITTED: ['UNDER_REVIEW', 'QUOTE_SENT', 'DECLINED', 'CANCELLED'],
  UNDER_REVIEW: ['QUOTE_SENT', 'DECLINED', 'CANCELLED'],
  QUOTE_SENT: ['ACCEPTED', 'DECLINED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  DECLINED: [],
  CANCELLED: [],
};

export function assertAppointmentTransition(
  from: AppointmentStatus,
  to: AppointmentStatus,
) {
  if (!APPOINTMENT[from].includes(to))
    throw conflict(`Transition ${from} → ${to} non autorisée`, 'BAD_TRANSITION');
}
export function assertOrderTransition(from: OrderStatus, to: OrderStatus) {
  if (!ORDER[from].includes(to))
    throw conflict(`Transition ${from} → ${to} non autorisée`, 'BAD_TRANSITION');
}
export function assertRequestTransition(
  from: ServiceRequestStatus,
  to: ServiceRequestStatus,
) {
  if (!REQUEST[from].includes(to))
    throw conflict(`Transition ${from} → ${to} non autorisée`, 'BAD_TRANSITION');
}
