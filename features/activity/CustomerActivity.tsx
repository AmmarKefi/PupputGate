import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { palette, spacing } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/lib/api';
import { config } from '@/lib/config';
import { formatMillimes, formatDateTime } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import type { Appointment, Order, ServiceRequest } from '@/types';

export function CustomerActivity() {
  const { t, locale } = useLocale();
  const { data, loading, error, refetch } = useQuery(() => api.activity(), { pollMs: config.pollIntervalMs });
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
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

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState error={error} onRetry={refetch} />;

  const appts = data?.appointments ?? [];
  const orders = data?.orders ?? [];
  const requests = data?.requests ?? [];
  const empty = appts.length + orders.length + requests.length === 0;

  if (empty) {
    return <EmptyState icon="pulse-outline" title={t('activity.empty')} hint={t('activity.emptyHint')} />;
  }

  const loc = locale as 'fr' | 'en' | 'ar';

  return (
    <View>
      {appts.length > 0 ? (
        <>
          <SectionHeader title={t('activity.appointments')} />
          {appts.map((a: Appointment) => (
            <Card key={a.id} style={styles.item}>
              <View style={styles.rowBetween}>
                <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                  {a.businessName}
                </Text>
                <StatusBadge status={a.status} />
              </View>
              <Text variant="meta" muted style={styles.line}>
                {a.serviceName} · {formatDateTime(a.startIso, loc)} · {formatMillimes(a.priceMillimes, loc)}
              </Text>
              {(a.status === 'PENDING' || a.status === 'CONFIRMED') && (
                <Button
                  label={t('common.cancel')}
                  variant="ghost"
                  fullWidth={false}
                  loading={busy === a.id}
                  onPress={() => act(a.id, () => api.cancelAppointment(a.id))}
                  style={{ marginTop: spacing.sm }}
                />
              )}
            </Card>
          ))}
        </>
      ) : null}

      {orders.length > 0 ? (
        <>
          <SectionHeader title={t('activity.orders')} />
          {orders.map((o: Order) => (
            <Card key={o.id} style={styles.item}>
              <View style={styles.rowBetween}>
                <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                  {o.businessName}
                </Text>
                <StatusBadge status={o.status} />
              </View>
              <Text variant="meta" muted style={styles.line}>
                {o.lines.map((l) => `${l.quantity}× ${l.productName}`).join(', ')}
              </Text>
              <Text variant="meta" style={styles.line}>
                {t('order.total')}: {formatMillimes(o.totalMillimes, loc)} · {t('common.payOnSite')}
              </Text>
              {(o.status === 'PENDING' || o.status === 'CONFIRMED') && (
                <Button
                  label={t('common.cancel')}
                  variant="ghost"
                  fullWidth={false}
                  loading={busy === o.id}
                  onPress={() => act(o.id, () => api.cancelOrder(o.id))}
                  style={{ marginTop: spacing.sm }}
                />
              )}
            </Card>
          ))}
        </>
      ) : null}

      {requests.length > 0 ? (
        <>
          <SectionHeader title={t('activity.requests')} />
          {requests.map((r: ServiceRequest) => (
            <Card key={r.id} style={styles.item}>
              <View style={styles.rowBetween}>
                <Text variant="bodyStrong" style={{ flex: 1 }} numberOfLines={1}>
                  {r.businessName}
                </Text>
                <StatusBadge status={r.status} />
              </View>
              <Text variant="meta" muted style={styles.line}>
                {r.problemType}
              </Text>
              {r.status === 'QUOTE_SENT' && r.quotation ? (
                <View style={styles.quoteBox}>
                  <Text variant="meta">
                    {t('quote.amount')}: {formatMillimes(r.quotation.amountMillimes, loc)}
                    {r.quotation.advanceMillimes != null
                      ? ` · ${t('quote.advance')}: ${formatMillimes(r.quotation.advanceMillimes, loc)}`
                      : ''}
                  </Text>
                  {r.quotation.scope ? (
                    <Text variant="meta" muted style={{ marginTop: 2 }}>
                      {r.quotation.scope}
                    </Text>
                  ) : null}
                  <Text variant="meta" muted style={{ marginTop: 4 }}>
                    {t('quote.advanceNotice')}
                  </Text>
                  <View style={styles.quoteActions}>
                    <Button label={t('quote.decline')} variant="ghost" fullWidth={false} loading={busy === r.id} onPress={() => act(r.id, () => api.declineQuotation(r.id))} />
                    <Button label={t('quote.accept')} fullWidth={false} loading={busy === r.id} onPress={() => act(r.id, () => api.acceptQuotation(r.id))} />
                  </View>
                </View>
              ) : null}
            </Card>
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { marginBottom: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  line: { marginTop: 4 },
  quoteBox: { marginTop: spacing.md, padding: spacing.md, backgroundColor: palette.mint, borderRadius: 14 },
  quoteActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
});
