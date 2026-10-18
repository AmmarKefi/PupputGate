import { API_BASE_URL } from './config';
import type {
  AuthResponse,
  BusinessSummary,
  BusinessDetail,
  Category,
  Zone,
  Appointment,
  Order,
  ServiceRequest,
  PublicUser,
} from '@/types';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}
export function setUnauthorizedHandler(fn: (() => void) | null) {
  onUnauthorized = fn;
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    });
  } catch (e) {
    throw new ApiError(0, 'NETWORK', 'NETWORK', e);
  }

  if (res.status === 401 && onUnauthorized) onUnauthorized();

  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const errBody = (data ?? {}) as { error?: string; code?: string; details?: unknown };
    throw new ApiError(res.status, errBody.error ?? 'Erreur', errBody.code, errBody.details);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export interface BusinessListParams {
  q?: string;
  mode?: string;
  category?: string;
  zone?: string;
  availableNow?: boolean;
  lat?: number;
  lng?: number;
  sort?: 'rating' | 'distance' | 'name';
  featured?: boolean;
}

export interface SlotDay {
  date: string;
  slots: { startIso: string; label: string; available: boolean }[];
}

export interface ActivityResponse {
  appointments: Appointment[];
  orders: Order[];
  requests: ServiceRequest[];
  counts: { activeAppointments: number; activeOrders: number; activeRequests: number };
  active:
    | { kind: 'appointment' | 'order' | 'request'; id: string; label: string; status: string }
    | null;
}

function qs(params: Record<string, unknown>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export const api = {
  // auth
  register: (body: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role?: 'CUSTOMER' | 'MERCHANT';
    locale?: string;
  }) => request<AuthResponse>('/auth/register', { method: 'POST', body }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),
  me: () => request<{ user: PublicUser }>('/auth/me'),

  // catalog
  categories: () => request<{ categories: Category[] }>('/categories'),
  zones: () => request<{ zones: Zone[] }>('/zones'),

  // discovery
  businesses: (params: BusinessListParams = {}) =>
    request<{ businesses: BusinessSummary[] }>(`/businesses${qs(params as unknown as Record<string, unknown>)}`),
  business: (slug: string) => request<{ business: BusinessDetail }>(`/businesses/${slug}`),
  slots: (businessId: string, serviceId: string, date?: string, days?: number) =>
    request<{ serviceId: string; durationMin: number; days: SlotDay[] }>(
      `/businesses/${businessId}/slots${qs({ serviceId, date, days })}`,
    ),
  favourites: () => request<{ businesses: BusinessSummary[] }>('/businesses/me/favourites'),
  addFavourite: (id: string) => request<{ favourite: boolean }>(`/businesses/${id}/favourite`, { method: 'POST' }),
  removeFavourite: (id: string) => request<{ favourite: boolean }>(`/businesses/${id}/favourite`, { method: 'DELETE' }),

  // commerce
  createAppointment: (body: { businessId: string; serviceId: string; startIso: string; note?: string }) =>
    request<{ appointment: Appointment }>('/appointments', { method: 'POST', body }),
  cancelAppointment: (id: string) =>
    request<{ appointment: Appointment }>(`/appointments/${id}/cancel`, { method: 'POST' }),
  createOrder: (body: {
    businessId: string;
    lines: { productId: string; quantity: number }[];
    pickupIso?: string;
    note?: string;
  }) => request<{ order: Order }>('/orders', { method: 'POST', body }),
  cancelOrder: (id: string) => request<{ order: Order }>(`/orders/${id}/cancel`, { method: 'POST' }),
  createRequest: (body: {
    businessId: string;
    problemType: string;
    description: string;
    zoneSlug: string;
    address?: string;
    timeWindow?: string;
    urgent?: boolean;
    photoUrls?: string[];
  }) => request<{ request: ServiceRequest }>('/requests', { method: 'POST', body }),
  acceptQuotation: (id: string) => request<{ request: ServiceRequest }>(`/requests/${id}/accept`, { method: 'POST' }),
  declineQuotation: (id: string) => request<{ request: ServiceRequest }>(`/requests/${id}/decline`, { method: 'POST' }),
  cancelRequest: (id: string) => request<{ request: ServiceRequest }>(`/requests/${id}/cancel`, { method: 'POST' }),

  // activity
  activity: () => request<ActivityResponse>('/activity'),

  // reviews
  reviews: (businessId: string) =>
    request<{ reviews: { id: string; rating: number; comment: string | null; authorName: string; isDemo: boolean; createdAt: string }[] }>(
      `/reviews${qs({ businessId })}`,
    ),

  // account
  updateProfile: (body: { fullName?: string; phone?: string; locale?: string }) =>
    request<{ user: PublicUser }>('/account/profile', { method: 'PATCH', body }),
  notifications: () =>
    request<{ notifications: { id: string; titleKey: string; bodyKey: string; read: boolean; createdAt: string }[]; unread: number }>(
      '/account/notifications',
    ),

  // generic passthrough for merchant/admin screens
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
