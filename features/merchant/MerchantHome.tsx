import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { useAuth } from '@/hooks/useAuth';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useLocale } from '@/hooks/useLocale';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import { brandTeal, modeAccent, palette, radius, spacing } from '@/theme/tokens';
import { buildFeed } from './todos';
import { TodoCard } from './TodoCard';
import { useMerchantData } from './useMerchantData';

type Seg = 'appointments' | 'orders' | 'quotes';

/**
 * The professional's landing screen: who they are, whether the shop is open,
 * what needs doing today (as big tappable numbers), and the next few actions
 * they can finish without leaving the page.
 */
export function MerchantHome() {
  const router = useRouter();
  const { t, locale, isRTL } = useLocale();
  const loc = locale as 'fr' | 'en' | 'ar';
  const { user } = useAuth();
  const space = useBottomSpace();
  const { biz, businesses, currentId, current, setSelectedId, dash, busy, act } = useMerchantData();
  const { data: notif } = useQuery(() => api.notifications(), { pollMs: 30000 });
  const unread = notif?.unread ?? 0;

  const d = dash.data;
  const first = (user?.fullName ?? '').split(' ')[0];
  const row = { flexDirection: isRTL ? ('row-reverse' as const) : ('row' as const) };
  const goQueue = (seg: Seg) => router.push({ pathname: '/activity', params: { seg } });

  const kpis: { seg: Seg; icon: keyof typeof Ionicons.glyphMap; value: number; label: string; tint: string }[] = d
    ? [
        { seg: 'appointments', icon: 'calendar', value: d.todaysAppointments.length, label: t('merchant.kpiToday'), tint: modeAccent.APPOINTMENT },
        { seg: 'appointments', icon: 'hourglass', value: d.pendingAppointmentCount, label: t('merchant.kpiToConfirm'), tint: '#E08A00' },
        { seg: 'orders', icon: 'bag-handle', value: d.ordersNeedingAction.length, label: t('merchant.kpiOrders'), tint: modeAccent.ORDER },
        { seg: 'quotes', icon: 'document-text', value: d.newRequests.length, label: t('merchant.kpiQuotes'), tint: modeAccent.QUOTE },
      ]
    : [];

  const status = d?.business.status ?? 'PENDING';
  const online = status === 'APPROVED' && d?.business.acceptingBookings;
  const pill =
    status === 'APPROVED'
      ? online
        ? { text: t('merchant.online'), color: '#1FB86B' }
        : { text: t('merchant.paused'), color: '#E08A00' }
      : status === 'PENDING'
        ? { text: t('merchant.pendingReview'), color: '#E08A00' }
        : { text: status === 'REJECTED' ? '✕' : '⏸', color: palette.errorRed };

  const feed = d ? buildFeed(d, t, loc, act, () => goQueue('quotes')) : [];

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space.scroll }}>
          <View style={styles.hero}>
            <LinearGradient pointerEvents="none" colors={[brandTeal, brandTeal, '#12A39A']} style={StyleSheet.absoluteFill} />

            <View style={[styles.topRow, row]}>
              <View style={{ flex: 1 }}>
                <Text variant="meta" color="rgba(255,255,255,0.85)">
                  {t('merchant.today')}
                </Text>
                <Text variant="title" color={palette.white} numberOfLines={1}>
                  {t('merchant.greeting', { name: first })}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/notifications')}
                accessibilityRole="button"
                accessibilityLabel={t('account.notifications')}
                hitSlop={10}
                style={styles.bell}
              >
                <Ionicons name="notifications-outline" size={27} color={palette.white} />
                {unread > 0 ? (
                  <View style={styles.badge}>
                    <Text variant="eyebrow" color={palette.white} style={styles.badgeText}>
                      {unread > 9 ? '9+' : String(unread)}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            </View>

            {businesses.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcher}>
                {businesses.map((b) => {
                  const on = b.id === currentId;
                  return (
                    <Pressable
                      key={b.id}
                      onPress={() => {
                        haptics.tap();
                        setSelectedId(b.id);
                      }}
                      style={[styles.shopChip, on && styles.shopChipOn]}
                    >
                      <Text variant="meta" color={on ? palette.deepGreen : palette.white} numberOfLines={1} style={{ fontWeight: '700' }}>
                        {b.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            {/* Shop status + the one switch that matters */}
            {d ? (
              <Animated.View entering={FadeInDown.duration(380)} style={styles.statusWrap}>
                <View style={styles.statusCard}>
                  <View style={styles.statusInner}>
                    <View style={[styles.statusTop, row]}>
                      <View style={{ flex: 1 }}>
                        <Text variant="section" color={palette.ink} numberOfLines={1}>
                          {d.business.name}
                        </Text>
                        <View style={[styles.pill, { backgroundColor: `${pill.color}22` }]}>
                          <View style={[styles.pillDot, { backgroundColor: pill.color }]} />
                          <Text variant="eyebrow" color={pill.color} style={styles.pillText}>
                            {pill.text}
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        onPress={() => current && router.push(`/business/${current.slug}`)}
                        style={styles.viewBtn}
                        accessibilityRole="button"
                        accessibilityLabel={t('merchant.viewShop')}
                      >
                        <Ionicons name="eye" size={18} color={palette.forest} />
                      </Pressable>
                    </View>

                    {status === 'APPROVED' ? (
                      <View style={[styles.switchRow, row]}>
                        <View style={{ flex: 1 }}>
                          <Text variant="bodyStrong">{t('merchant.acceptBookings')}</Text>
                          <Text variant="meta" muted>
                            {d.business.acceptingBookings ? t('merchant.acceptHintOn') : t('merchant.acceptHintOff')}
                          </Text>
                        </View>
                        <Switch
                          value={d.business.acceptingBookings}
                          disabled={busy === 'pause'}
                          trackColor={{ false: '#C9D4D2', true: '#7FD8CF' }}
                          thumbColor={d.business.acceptingBookings ? palette.forest : '#F4F6F6'}
                          onValueChange={() => {
                            haptics.tap();
                            act('pause', () =>
                              api.post(`/merchant/businesses/${d.business.id}/${d.business.acceptingBookings ? 'pause' : 'resume'}`),
                            );
                          }}
                        />
                      </View>
                    ) : (
                      <Text variant="meta" muted style={{ marginTop: spacing.sm }}>
                        {status === 'PENDING'
                          ? t('dash.pendingHint')
                          : status === 'REJECTED'
                            ? t('dash.rejectedHint')
                            : t('dash.suspendedHint')}
                      </Text>
                    )}

                    <Pressable
                      onPress={() => {
                        haptics.tap();
                        router.push({ pathname: '/activity', params: { seg: 'storefront' } });
                      }}
                      style={[styles.manageShopBanner, row]}
                      accessibilityRole="button"
                    >
                      <View style={styles.manageShopIcon}>
                        <Ionicons name="storefront-outline" size={17} color={palette.forest} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyStrong" style={{ fontSize: 13.5 }}>
                          Gérer la vitrine, produits & bannière
                        </Text>
                        <Text variant="meta" muted style={{ fontSize: 11, marginTop: 1 }}>
                          Modifier l'image de couverture, ajouter des articles et réservations
                        </Text>
                      </View>
                      <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={palette.forest} />
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            ) : null}
          </View>

          {/* White sheet */}
          <View style={styles.arc} />
          <View style={styles.sheet}>
            {biz.loading || (dash.loading && !d) ? (
              <LoadingState />
            ) : biz.error ? (
              <ErrorState error={biz.error} onRetry={biz.refetch} />
            ) : businesses.length === 0 ? (
              <View>
                <EmptyState icon="storefront-outline" title={t('dash.noBusiness')} hint={t('dash.noBusinessHint')} />
                <Button label={t('dash.onboard')} onPress={() => router.push('/onboarding/business')} style={{ marginTop: spacing.lg }} />
              </View>
            ) : d ? (
              <>
                <View style={styles.kpiGrid}>
                  {kpis.map((k, i) => (
                    <Animated.View key={k.label} entering={FadeInDown.delay(80 + i * 60).duration(360)} style={styles.kpiCell}>
                      <Pressable
                        onPress={() => {
                          haptics.tap();
                          goQueue(k.seg);
                        }}
                        style={({ pressed }) => [styles.kpi, pressed && { transform: [{ scale: 0.97 }] }]}
                        accessibilityRole="button"
                        accessibilityLabel={`${k.label}: ${k.value}`}
                      >
                        <View style={[styles.kpiIcon, { backgroundColor: `${k.tint}1C` }]}>
                          <Ionicons name={k.icon} size={18} color={k.tint} />
                        </View>
                        <Text variant="hero" color={k.value > 0 ? k.tint : palette.ink} style={styles.kpiValue}>
                          {k.value}
                        </Text>
                        <Text variant="meta" muted numberOfLines={1}>
                          {k.label}
                        </Text>
                      </Pressable>
                    </Animated.View>
                  ))}
                </View>

                <View style={[styles.sectionRow, row]}>
                  <Text variant="section">{t('merchant.todo')}</Text>
                  {feed.length > 0 ? (
                    <Pressable onPress={() => goQueue('appointments')} hitSlop={8}>
                      <Text variant="meta" color={palette.forest} style={{ fontWeight: '700' }}>
                        {t('merchant.openQueue')}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {feed.length === 0 ? (
                  <Animated.View entering={FadeInDown.duration(360)} style={styles.allClear}>
                    <View style={styles.allClearIcon}>
                      <Ionicons name="checkmark-done" size={28} color={palette.white} />
                    </View>
                    <Text variant="bodyStrong" style={{ marginTop: spacing.md }}>
                      {t('merchant.allClear')}
                    </Text>
                    <Text variant="meta" muted center style={{ marginTop: 2 }}>
                      {t('merchant.allClearHint')}
                    </Text>
                  </Animated.View>
                ) : (
                  feed.slice(0, 4).map((todo, i) => <TodoCard key={todo.id} todo={todo} busy={busy === todo.id} index={i} />)
                )}

                <Button
                  label={t('merchant.addShop')}
                  variant="secondary"
                  icon="add-circle-outline"
                  onPress={() => router.push('/onboarding/business')}
                  style={{ marginTop: spacing.lg }}
                />
              </>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brandTeal },
  safe: { flex: 1, backgroundColor: brandTeal },
  hero: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.xl + 8 },
  topRow: { alignItems: 'center', justifyContent: 'space-between' },
  bell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 3, right: 2, minWidth: 19, height: 19, borderRadius: 10, paddingHorizontal: 4, backgroundColor: '#F2542D', alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10.5, lineHeight: 13, letterSpacing: 0 },
  switcher: { gap: spacing.sm, paddingTop: spacing.md },
  shopChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' },
  shopChipOn: { backgroundColor: palette.white, borderColor: palette.white },
  statusWrap: { marginTop: spacing.lg },
  statusCard: {
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#003F3A',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  statusInner: { padding: spacing.lg },
  statusTop: { alignItems: 'center', gap: spacing.md },
  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontSize: 10.5, lineHeight: 13, letterSpacing: 0.3, textTransform: 'none', fontWeight: '800' },
  viewBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,128,120,0.12)', alignItems: 'center', justifyContent: 'center' },
  switchRow: { alignItems: 'center', gap: spacing.md, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
  manageShopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.border,
  },
  manageShopIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: `${palette.forest}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arc: { height: 70, marginTop: -44, backgroundColor: palette.white, borderTopLeftRadius: '50%', borderTopRightRadius: '50%' },
  sheet: { backgroundColor: palette.white, marginTop: -1, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, minHeight: 420 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -spacing.xs },
  kpiCell: { width: '50%', padding: spacing.xs },
  kpi: {
    backgroundColor: palette.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,79,72,0.08)',
    shadowColor: '#003F3A',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  kpiIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  kpiValue: { marginTop: spacing.sm, fontSize: 38, lineHeight: 44 },
  sectionRow: { alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.md },
  allClear: { alignItems: 'center', paddingVertical: spacing.xl, backgroundColor: '#F1FAF8', borderRadius: radius.card },
  allClearIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1FB86B', alignItems: 'center', justifyContent: 'center' },
});
