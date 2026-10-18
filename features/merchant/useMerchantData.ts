import { useState } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/lib/api';
import { config } from '@/lib/config';
import { haptics } from '@/lib/haptics';
import type { Appointment, BusinessDetail, Order, ServiceRequest } from '@/types';

export interface DashboardData {
  business: { id: string; name: string; status: string; acceptingBookings: boolean };
  todaysAppointments: Appointment[];
  pendingAppointmentCount: number;
  ordersNeedingAction: Order[];
  newRequests: ServiceRequest[];
}

/**
 * One source of truth for the professional's data: their businesses, the
 * selected business's live dashboard, and a guarded `act` for state changes.
 */
export function useMerchantData() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const biz = useQuery(() => api.get<{ businesses: BusinessDetail[] }>('/merchant/businesses'), {});
  const businesses = biz.data?.businesses ?? [];
  const currentId = selectedId ?? businesses[0]?.id ?? null;
  const current = businesses.find((b) => b.id === currentId) ?? null;

  const dash = useQuery(() => api.get<DashboardData>(`/merchant/businesses/${currentId}/dashboard`), {
    enabled: !!currentId,
    deps: [currentId],
    pollMs: config.pollIntervalMs,
  });

  async function act(key: string, fn: () => Promise<unknown>) {
    setBusy(key);
    try {
      await fn();
      haptics.success();
      dash.refetch();
    } catch {
      haptics.error();
    } finally {
      setBusy(null);
    }
  }

  return { biz, businesses, currentId, current, setSelectedId, dash, busy, act };
}

export type MerchantAct = ReturnType<typeof useMerchantData>['act'];
