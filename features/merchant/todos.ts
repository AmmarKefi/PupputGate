import { api } from '@/lib/api';
import { formatDateTime, formatMillimes } from '@/lib/format';
import type { MerchantAct, DashboardData } from './useMerchantData';
import type { Appointment, Order } from '@/types';
import type { Ionicons } from '@expo/vector-icons';

type T = (key: any, params?: Record<string, string | number>) => string;
type Loc = 'fr' | 'en' | 'ar';

export interface TodoAction {
  label: string;
  tone: 'primary' | 'ghost' | 'secondary';
  run: () => void;
}

export interface Todo {
  id: string;
  kind: 'appointment' | 'order' | 'request';
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  status: string;
  actions: TodoAction[];
}

export function appointmentActions(a: Appointment, t: T, act: MerchantAct): TodoAction[] {
  const go = (to: string) => () => act(a.id, () => api.post(`/merchant/appointments/${a.id}/transition`, { to }));
  if (a.status === 'PENDING') {
    return [
      { label: t('dash.reject'), tone: 'ghost', run: go('REJECTED') },
      { label: t('dash.confirm'), tone: 'primary', run: go('CONFIRMED') },
    ];
  }
  if (a.status === 'CONFIRMED') return [{ label: t('dash.complete'), tone: 'secondary', run: go('COMPLETED') }];
  return [];
}

export function orderActions(o: Order, t: T, act: MerchantAct): TodoAction[] {
  const go = (to: string) => () => act(o.id, () => api.post(`/merchant/orders/${o.id}/transition`, { to }));
  if (o.status === 'PENDING') {
    return [
      { label: t('dash.reject'), tone: 'ghost', run: go('REJECTED') },
      { label: t('dash.confirm'), tone: 'primary', run: go('CONFIRMED') },
    ];
  }
  if (o.status === 'CONFIRMED') return [{ label: t('dash.markPreparing'), tone: 'primary', run: go('PREPARING') }];
  if (o.status === 'PREPARING') return [{ label: t('dash.markReady'), tone: 'primary', run: go('READY_FOR_PICKUP') }];
  return [];
}

export function appointmentTodo(a: Appointment, t: T, loc: Loc, act: MerchantAct): Todo {
  return {
    id: a.id,
    kind: 'appointment',
    icon: 'calendar',
    title: a.serviceName,
    sub: `${formatDateTime(a.startIso, loc)} · ${formatMillimes(a.priceMillimes, loc)}`,
    status: a.status,
    actions: appointmentActions(a, t, act),
  };
}

export function orderTodo(o: Order, t: T, loc: Loc, act: MerchantAct): Todo {
  return {
    id: o.id,
    kind: 'order',
    icon: 'bag-handle',
    title: o.lines.map((l) => `${l.quantity}× ${l.productName}`).join(', '),
    sub: `${formatMillimes(o.totalMillimes, loc)}${o.pickupIso ? ` · ${formatDateTime(o.pickupIso, loc)}` : ''}`,
    status: o.status,
    actions: orderActions(o, t, act),
  };
}

/**
 * What needs the owner's attention right now, most urgent first: bookings to
 * confirm, orders to move along, quote requests, then bookings to complete.
 */
export function buildFeed(d: DashboardData, t: T, loc: Loc, act: MerchantAct, openQuotes: () => void): Todo[] {
  const pendingAppts = d.todaysAppointments.filter((a) => a.status === 'PENDING');
  const confirmedAppts = d.todaysAppointments.filter((a) => a.status === 'CONFIRMED');
  return [
    ...pendingAppts.map((a) => appointmentTodo(a, t, loc, act)),
    ...d.ordersNeedingAction.map((o) => orderTodo(o, t, loc, act)),
    ...d.newRequests.map<Todo>((r) => ({
      id: r.id,
      kind: 'request',
      icon: 'document-text',
      title: r.problemType,
      sub: r.description,
      status: r.status,
      actions: [{ label: t('dash.sendQuote'), tone: 'primary', run: openQuotes }],
    })),
    ...confirmedAppts.map((a) => appointmentTodo(a, t, loc, act)),
  ];
}
