import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { palette, spacing } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import type { BusinessSummary, PublicUser } from '@/types';

type Tab = 'overview' | 'pending' | 'users' | 'reviews';

interface Kpis {
  users: number; businesses: number; pendingBusinesses: number;
  appointments: number; orders: number; serviceRequests: number;
}
interface ReviewRow {
  id: string; rating: number; comment: string | null; status: string;
  business: { name: string }; author: { fullName: string };
}

export function AdminConsole() {
  const { t } = useLocale();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [busy, setBusy] = useState<string | null>(null);

  const overview = useQuery(() => api.get<{ kpis: Kpis }>('/admin/overview'), { enabled: tab === 'overview' });
  const pending = useQuery(() => api.get<{ businesses: BusinessSummary[] }>('/admin/businesses?status=PENDING'), { enabled: tab === 'pending' });
  const users = useQuery(() => api.get<{ users: PublicUser[] }>('/admin/users'), { enabled: tab === 'users' });
  const reviews = useQuery(() => api.get<{ reviews: ReviewRow[] }>('/admin/reviews?status=REPORTED'), { enabled: tab === 'reviews' });

  async function act(key: string, fn: () => Promise<unknown>, refetch: () => void) {
    setBusy(key);
    try {
      await fn();
      haptics.success();
      refetch();
    } catch {
      haptics.error();
    } finally {
      setBusy(null);
    }
  }

  return (
    <View>
      <View style={styles.tabs}>
        <Chip label={t('admin.overview')} selected={tab === 'overview'} onPress={() => setTab('overview')} />
        <Chip label={t('admin.pending')} selected={tab === 'pending'} onPress={() => setTab('pending')} />
        <Chip label={t('admin.users')} selected={tab === 'users'} onPress={() => setTab('users')} />
        <Chip label={t('admin.reviews')} selected={tab === 'reviews'} onPress={() => setTab('reviews')} />
      </View>

      {tab === 'overview' ? (
        overview.loading ? <LoadingState /> : overview.error ? <ErrorState error={overview.error} onRetry={overview.refetch} /> : (
          <View style={styles.kpiGrid}>
            <Kpi label={t('admin.kpiUsers')} value={overview.data?.kpis.users} />
            <Kpi label={t('admin.kpiBusinesses')} value={overview.data?.kpis.businesses} />
            <Kpi label={t('admin.kpiPending')} value={overview.data?.kpis.pendingBusinesses} highlight />
            <Kpi label={t('admin.kpiAppointments')} value={overview.data?.kpis.appointments} />
            <Kpi label={t('admin.kpiOrders')} value={overview.data?.kpis.orders} />
            <Kpi label={t('admin.kpiRequests')} value={overview.data?.kpis.serviceRequests} />
          </View>
        )
      ) : null}

      {tab === 'pending' ? (
        pending.loading ? <LoadingState /> : (pending.data?.businesses.length ?? 0) === 0 ? (
          <EmptyState icon="checkmark-done-outline" title={t('state.emptyGeneric')} />
        ) : (
          pending.data!.businesses.map((b) => (
            <Card key={b.id} style={styles.item}>
              <Text variant="bodyStrong">{b.name}</Text>
              <Text variant="meta" muted>{b.zoneName} · {b.categorySlug}</Text>
              <View style={styles.actions}>
                <Button label={t('admin.reject')} variant="ghost" fullWidth={false} loading={busy === b.id}
                  onPress={() => act(b.id, () => api.post(`/admin/businesses/${b.id}/reject`), pending.refetch)} />
                <Button label={t('admin.approve')} fullWidth={false} loading={busy === b.id}
                  onPress={() => act(b.id, () => api.post(`/admin/businesses/${b.id}/approve`), pending.refetch)} />
              </View>
            </Card>
          ))
        )
      ) : null}

      {tab === 'users' ? (
        users.loading ? <LoadingState /> : (
          users.data!.users.map((u) => (
            <Card key={u.id} style={styles.item}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong">{u.fullName}</Text>
                  <Text variant="meta" muted>{u.email} · {t(`account.role.${u.role}` as 'account.role.CUSTOMER')}</Text>
                </View>
                {u.id === user?.id ? (
                  <Text variant="meta" muted>—</Text>
                ) : u.suspended ? (
                  <Button label={t('admin.reactivate')} variant="secondary" fullWidth={false} loading={busy === u.id}
                    onPress={() => act(u.id, () => api.post(`/admin/users/${u.id}/reactivate`), users.refetch)} />
                ) : (
                  <Button label={t('admin.suspend')} variant="ghost" fullWidth={false} loading={busy === u.id}
                    onPress={() => act(u.id, () => api.post(`/admin/users/${u.id}/suspend`), users.refetch)} />
                )}
              </View>
            </Card>
          ))
        )
      ) : null}

      {tab === 'reviews' ? (
        reviews.loading ? <LoadingState /> : (reviews.data?.reviews.length ?? 0) === 0 ? (
          <EmptyState icon="shield-checkmark-outline" title={t('state.emptyGeneric')} />
        ) : (
          reviews.data!.reviews.map((r) => (
            <Card key={r.id} style={styles.item}>
              <Text variant="bodyStrong">{r.business.name} · {'★'.repeat(r.rating)}</Text>
              {r.comment ? <Text variant="meta" muted style={{ marginTop: 4 }}>{r.comment}</Text> : null}
              <View style={styles.actions}>
                <Button label={t('admin.hide')} variant="ghost" fullWidth={false} loading={busy === r.id}
                  onPress={() => act(r.id, () => api.post(`/admin/reviews/${r.id}/hide`), reviews.refetch)} />
                <Button label={t('admin.publish')} fullWidth={false} loading={busy === r.id}
                  onPress={() => act(r.id, () => api.post(`/admin/reviews/${r.id}/publish`), reviews.refetch)} />
              </View>
            </Card>
          ))
        )
      ) : null}
    </View>
  );
}

function Kpi({ label, value, highlight }: { label: string; value?: number; highlight?: boolean }) {
  return (
    <View style={styles.kpiCell}>
      <Card style={[styles.kpi, highlight && { backgroundColor: palette.mint }]}>
        <Text variant="hero" color={highlight ? palette.deepGreen : palette.forest}>
          {value ?? '—'}
        </Text>
        <Text variant="meta" muted>{label}</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  kpiCell: { width: '33.33%', padding: spacing.xs },
  kpi: { alignItems: 'flex-start' },
  item: { marginBottom: spacing.md },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
});
