import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { StatusBadge } from '@/components/StatusBadge';
import { Segmented } from '@/components/Segmented';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { palette, radius, spacing, modeAccent } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import { api } from '@/lib/api';
import { parseDinarsToMillimes } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import type { ServiceRequest } from '@/types';
import { appointmentTodo, orderTodo } from './todos';
import { TodoCard } from './TodoCard';
import { useMerchantData } from './useMerchantData';
import { MerchantStorefront } from './MerchantStorefront';

export type QueueSeg = 'appointments' | 'orders' | 'quotes' | 'storefront';

/**
 * Everything waiting on the owner, split in three segments with live counts.
 * Each card carries its own next-step buttons; quotes open an inline form.
 */
export function MerchantDashboard({ initialSeg = 'appointments' }: { initialSeg?: QueueSeg }) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const loc = locale as 'fr' | 'en' | 'ar';
  const { biz, businesses, currentId, current, setSelectedId, dash, busy, act } = useMerchantData();
  const [seg, setSeg] = useState<QueueSeg>(initialSeg);

  // A tap on a counter in "Aujourd'hui" lands on the matching segment.
  useEffect(() => setSeg(initialSeg), [initialSeg]);

  if (biz.loading) return <LoadingState />;
  if (biz.error) return <ErrorState error={biz.error} onRetry={biz.refetch} />;

  if (businesses.length === 0) {
    return (
      <View style={{ paddingTop: spacing.xl }}>
        <EmptyState icon="storefront-outline" title={t('dash.noBusiness')} hint={t('dash.noBusinessHint')} />
        <Button label={t('dash.onboard')} onPress={() => router.push('/onboarding/business')} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  const d = dash.data;

  return (
    <View>
      {businesses.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.switcher}
          style={styles.switcherScroll}
        >
          {businesses.map((b) => {
            const on = b.id === currentId;
            return (
              <Pressable
                key={b.id}
                onPress={() => {
                  haptics.tap();
                  setSelectedId(b.id);
                }}
                style={[styles.shopChip, on && { backgroundColor: palette.forest, borderColor: palette.forest }]}
              >
                <Text variant="meta" color={on ? palette.white : palette.ink} style={{ fontWeight: '700' }}>
                  {b.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {dash.loading && !d ? (
        <LoadingState />
      ) : !d ? null : (
        <>
          <Segmented<QueueSeg>
            value={seg}
            onChange={setSeg}
            options={[
              { id: 'appointments', label: t('merchant.tabAppointments'), badge: d.todaysAppointments.length },
              { id: 'orders', label: t('merchant.tabOrders'), badge: d.ordersNeedingAction.length },
              { id: 'quotes', label: t('merchant.tabQuotes'), badge: d.newRequests.length },
              { id: 'storefront', label: 'Boutique' },
            ]}
          />

          <View style={{ marginTop: spacing.lg }}>
            {seg === 'storefront' ? (
              current ? (
                <MerchantStorefront
                  business={current}
                  onUpdated={() => {
                    biz.refetch();
                    dash.refetch();
                  }}
                />
              ) : null
            ) : seg === 'appointments' ? (
              d.todaysAppointments.length === 0 ? (
                <EmptyState icon="calendar-outline" title={t('merchant.noAppointments')} />
              ) : (
                d.todaysAppointments.map((a, i) => (
                  <TodoCard key={a.id} todo={appointmentTodo(a, t, loc, act)} busy={busy === a.id} index={i} />
                ))
              )
            ) : seg === 'orders' ? (
              d.ordersNeedingAction.length === 0 ? (
                <EmptyState icon="bag-handle-outline" title={t('merchant.noOrders')} />
              ) : (
                d.ordersNeedingAction.map((o, i) => (
                  <TodoCard key={o.id} todo={orderTodo(o, t, loc, act)} busy={busy === o.id} index={i} />
                ))
              )
            ) : d.newRequests.length === 0 ? (
              <EmptyState icon="document-text-outline" title={t('merchant.noQuotes')} />
            ) : (
              d.newRequests.map((r, i) => (
                <QuoteCard
                  key={r.id}
                  request={r}
                  index={i}
                  busy={busy === r.id}
                  onQuote={(amountMillimes, advanceMillimes) =>
                    act(r.id, () => api.post(`/merchant/requests/${r.id}/quote`, { amountMillimes, advanceMillimes }))
                  }
                />
              ))
            )}
          </View>
        </>
      )}
    </View>
  );
}

function QuoteCard({
  request: r,
  busy,
  index,
  onQuote,
}: {
  request: ServiceRequest;
  busy: boolean;
  index: number;
  onQuote: (amountMillimes: number, advanceMillimes?: number) => void;
}) {
  const { t } = useLocale();
  const accent = modeAccent.QUOTE;
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [advance, setAdvance] = useState('');
  const [err, setErr] = useState<string | null>(null);

  function submit() {
    const a = parseDinarsToMillimes(amount);
    if (a == null || a <= 0) return setErr(t('error.generic'));
    const adv = advance ? parseDinarsToMillimes(advance) : undefined;
    if (advance && (adv == null || adv > a)) return setErr(t('error.generic'));
    setErr(null);
    onQuote(a, adv ?? undefined);
  }

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 6) * 55).duration(320)} style={styles.quote}>
      <View style={[styles.edge, { backgroundColor: accent }]} />
      <View style={{ flex: 1, padding: spacing.md + 2 }}>
        <View style={styles.qTop}>
          <View style={[styles.qIcon, { backgroundColor: `${accent}18` }]}>
            <Ionicons name="document-text" size={18} color={accent} />
          </View>
          <Text variant="bodyStrong" numberOfLines={1} style={{ flex: 1 }}>
            {r.problemType}
          </Text>
          <StatusBadge status={r.status as never} />
        </View>
        <Text variant="meta" muted numberOfLines={3} style={{ marginTop: spacing.sm }}>
          {r.description}
        </Text>
        {r.address ? (
          <View style={styles.addr}>
            <Ionicons name="lock-closed" size={11} color={palette.mutedText} />
            <Text variant="meta" style={{ marginStart: 5, flex: 1 }}>
              {r.address}
            </Text>
          </View>
        ) : null}

        {!open ? (
          <Pressable
            onPress={() => {
              haptics.tap();
              setOpen(true);
            }}
            style={[styles.cta, { backgroundColor: accent }]}
            accessibilityRole="button"
          >
            <Ionicons name="send" size={15} color={palette.white} />
            <Text variant="bodyStrong" color={palette.white} style={{ marginStart: 8 }}>
              {t('dash.sendQuote')}
            </Text>
          </Pressable>
        ) : (
          <Animated.View entering={FadeInDown.duration(240)} style={{ marginTop: spacing.md }}>
            <Input label={`${t('quote.amount')} (DT)`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="55" />
            <Input label={`${t('quote.advance')} (DT)`} value={advance} onChangeText={setAdvance} keyboardType="decimal-pad" placeholder="10" hint={t('quote.advanceNotice')} />
            {err ? (
              <Text variant="meta" color={palette.errorRed} style={{ marginBottom: spacing.sm }}>
                {err}
              </Text>
            ) : null}
            <Button label={t('dash.sendQuote')} accent={accent} loading={busy} onPress={submit} />
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  switcherScroll: { flexGrow: 0, marginHorizontal: -spacing.xl, marginBottom: spacing.md },
  switcher: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  shopChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.white },
  quote: {
    flexDirection: 'row',
    backgroundColor: palette.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    marginBottom: spacing.md,
    shadowColor: '#003F3A',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  edge: { width: 5 },
  qTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  qIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  addr: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: 46, borderRadius: radius.pill, marginTop: spacing.md },
});
