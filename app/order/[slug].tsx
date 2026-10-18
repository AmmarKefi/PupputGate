import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { GlassFooter } from '@/components/GlassFooter';
import { KeyboardScroll } from '@/components/KeyboardScroll';
import { Input } from '@/components/Input';
import { BackHeader } from '@/components/BackHeader';
import { SuccessView } from '@/components/SuccessView';
import { LoadingState, ErrorState } from '@/components/states';
import { palette, radius, spacing, modeAccent } from '@/theme/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useQuery } from '@/hooks/useQuery';
import { api, ApiError } from '@/lib/api';
import { categoryPhoto } from '@/lib/categoryPhotos';
import { dayNumber, formatMillimes, weekdayShort } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { signInHref, withQuery } from '@/lib/returnTo';
import type { ProductItem } from '@/types';

/** Restores a cart from the `cart` URL param (JSON map of productId -> quantity). */
function parseCart(raw: string | undefined, fallbackProductId: string | undefined): Record<string, number> {
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const out: Record<string, number> = {};
        for (const [id, q] of Object.entries(parsed as Record<string, unknown>)) {
          if (typeof q === 'number' && Number.isInteger(q) && q > 0) out[id] = q;
        }
        return out;
      }
    } catch {
      /* fall through to the product fallback */
    }
  }
  return fallbackProductId ? { [String(fallbackProductId)]: 1 } : {};
}

const TIMES = ['09:00', '11:00', '13:00', '15:00', '17:00'];

function Step({ n, title, accent }: { n: number; title: string; accent: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={[styles.stepDot, { backgroundColor: accent }]}>
        <Text variant="eyebrow" color={palette.white} style={styles.stepNum}>
          {n}
        </Text>
      </View>
      <Text variant="section">{title}</Text>
    </View>
  );
}

function ProductRow({
  p,
  qty,
  max,
  accent,
  loc,
  onChange,
}: {
  p: ProductItem;
  qty: number;
  max: number;
  accent: string;
  loc: 'fr' | 'en' | 'ar';
  onChange: (delta: number) => void;
}) {
  const { t, isRTL } = useLocale();
  const disabled = max === 0;
  const bump = useSharedValue(1);
  useEffect(() => {
    bump.value = withSequence(withTiming(1.25, { duration: 90 }), withSpring(1, { damping: 8, stiffness: 260 }));
  }, [qty, bump]);
  const qtyStyle = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));

  const tag =
    p.stockStatus === 'UNIQUE_PIECE'
      ? t('business.uniquePiece')
      : p.stockStatus === 'OUT_OF_STOCK'
        ? t('business.outOfStock')
        : p.stockStatus === 'MADE_TO_ORDER'
          ? t('business.madeToOrder')
          : null;

  const step = (delta: number) => {
    haptics.tap();
    onChange(delta);
  };

  return (
    <Animated.View
      layout={LinearTransition.springify().damping(18)}
      style={[
        styles.productRow,
        qty > 0 && { borderColor: accent, backgroundColor: `${accent}0A` },
        disabled && { opacity: 0.55 },
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}
    >
      <View style={[styles.productIcon, { backgroundColor: `${accent}1A` }]}>
        <Ionicons name={p.stockStatus === 'UNIQUE_PIECE' ? 'diamond' : 'bag-handle'} size={20} color={accent} />
      </View>
      <View style={styles.productBody}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {p.name}
        </Text>
        {p.description ? (
          <Text variant="meta" muted numberOfLines={1}>
            {p.description}
          </Text>
        ) : null}
        <View style={[styles.productMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text variant="bodyStrong" color={accent}>
            {formatMillimes(p.priceMillimes, loc)}
          </Text>
          {tag ? (
            <View style={[styles.tag, { backgroundColor: p.stockStatus === 'OUT_OF_STOCK' ? '#F6E2DF' : `${accent}16` }]}>
              <Text variant="eyebrow" color={p.stockStatus === 'OUT_OF_STOCK' ? palette.errorRed : accent} style={styles.tagText}>
                {tag}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {disabled ? null : qty === 0 ? (
        <Pressable
          onPress={() => step(1)}
          accessibilityRole="button"
          accessibilityLabel={`${t('order.add')} ${p.name}`}
          style={[styles.addBtn, { backgroundColor: accent }]}
        >
          <Ionicons name="add" size={18} color={palette.white} />
          <Text variant="meta" color={palette.white} style={{ fontWeight: '700', marginStart: 2 }}>
            {t('order.add')}
          </Text>
        </Pressable>
      ) : (
        <View style={[styles.stepper, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: palette.white }]}>
          <Pressable onPress={() => step(-1)} style={styles.stepBtn} hitSlop={6} accessibilityRole="button" accessibilityLabel="-">
            <Ionicons name={qty === 1 ? 'trash-outline' : 'remove'} size={17} color={qty === 1 ? palette.errorRed : palette.ink} />
          </Pressable>
          <Animated.View style={qtyStyle}>
            <Text variant="bodyStrong" style={styles.qty}>
              {qty}
            </Text>
          </Animated.View>
          <Pressable onPress={() => step(1)} style={styles.stepBtn} hitSlop={6} accessibilityRole="button" accessibilityLabel="+">
            <Ionicons name="add" size={18} color={qty < max ? palette.ink : palette.border} />
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}

export default function OrderFlow() {
  const router = useRouter();
  const { t, locale, isRTL } = useLocale();
  const loc = locale as 'fr' | 'en' | 'ar';
  const { slug, productId, cart: initialCart, date: initialDate, time: initialTime, note: initialNote } = useLocalSearchParams<{
    slug: string;
    productId?: string;
    cart?: string;
    date?: string;
    time?: string;
    note?: string;
  }>();
  const { user } = useAuth();

  const business = useQuery(() => api.business(String(slug)), { deps: [slug] });
  const b = business.data?.business;
  const accent = b ? modeAccent[b.primaryMode === 'SHOWCASE' ? 'SHOWCASE' : 'ORDER'] : modeAccent.ORDER;

  const [cart, setCart] = useState<Record<string, number>>(() => parseCart(initialCart, productId));
  const [pickupDate, setPickupDate] = useState<string | null>(initialDate ?? null);
  const [pickupTime, setPickupTime] = useState<string | null>(initialTime ?? null);
  const [note, setNote] = useState(initialNote ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const products = b?.products ?? [];
  const hasUnique = useMemo(
    () => products.some((p) => p.stockStatus === 'UNIQUE_PIECE' && (cart[p.id] ?? 0) > 0),
    [products, cart],
  );
  const total = useMemo(
    () => products.reduce((sum, p) => sum + p.priceMillimes * (cart[p.id] ?? 0), 0),
    [products, cart],
  );
  const lineCount = Object.values(cart).filter((q) => q > 0).length;
  const itemCount = Object.values(cart).reduce((s, q) => s + q, 0);

  function maxFor(p: ProductItem): number {
    if (p.stockStatus === 'UNIQUE_PIECE') return 1;
    if (p.stockStatus === 'IN_STOCK') return p.stockQty ?? 0;
    if (p.stockStatus === 'OUT_OF_STOCK') return 0;
    return 20; // made to order
  }
  function setQty(p: ProductItem, delta: number) {
    setCart((c) => {
      const next = Math.max(0, Math.min(maxFor(p), (c[p.id] ?? 0) + delta));
      return { ...c, [p.id]: next };
    });
    setErrMsg(null);
  }

  // Next five days. Device-local (the phone runs on Tunis time).
  const dateOptions = useMemo(() => {
    const out: { iso: string; weekday: string; day: string }[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      out.push({
        iso,
        weekday: i === 0 ? t('common.now') : weekdayShort(`${iso}T12:00:00Z`, loc),
        day: dayNumber(`${iso}T12:00:00Z`, loc),
      });
    }
    return out;
  }, [t, loc]);

  function pickupIso(): string | undefined {
    if (!pickupDate || !pickupTime) return undefined;
    const [h, m] = pickupTime.split(':').map(Number);
    const d = new Date(`${pickupDate}T00:00:00`);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }

  const asap = !pickupDate && !pickupTime;
  const pickupLabel =
    pickupDate && pickupTime
      ? `${dateOptions.find((d) => d.iso === pickupDate)?.weekday ?? pickupDate} ${dateOptions.find((d) => d.iso === pickupDate)?.day ?? ''} · ${pickupTime}`
      : t('order.asap');

  async function submit() {
    if (!b) return;
    const lines = Object.entries(cart).filter(([, q]) => q > 0).map(([productId, quantity]) => ({ productId, quantity }));
    if (lines.length === 0) {
      haptics.warning();
      setErrMsg(t('order.empty'));
      return;
    }
    if (!user) {
      // Guest: keep the cart and pickup details, and return here after sign-in.
      const returnPath = withQuery(`/order/${slug}`, {
        cart: JSON.stringify(cart),
        date: pickupDate,
        time: pickupTime,
        note: note || null,
      });
      router.push(signInHref(returnPath) as never);
      return;
    }
    setSubmitting(true);
    setErrMsg(null);
    try {
      await api.createOrder({ businessId: b.id, lines, pickupIso: pickupIso(), note: note || undefined });
      setDone(true);
    } catch (e) {
      haptics.error();
      if (e instanceof ApiError && (e.code === 'UNIQUE_TAKEN' || e.code === 'INSUFFICIENT_STOCK' || e.code === 'OUT_OF_STOCK')) {
        setErrMsg(e.message);
        business.refetch();
      } else if (e instanceof ApiError && e.code === 'NETWORK') {
        setErrMsg(t('error.network'));
      } else {
        setErrMsg(t('error.generic'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (business.loading) return <SafeAreaView style={styles.flex}><LoadingState /></SafeAreaView>;
  if (business.error || !b) return <SafeAreaView style={styles.flex}><ErrorState error={business.error} onRetry={business.refetch} /></SafeAreaView>;

  if (done) {
    return (
      <SuccessView
        accent={accent}
        title={t('order.success')}
        hint={`${t('order.successHint')} ${t('order.trackHint')}`}
        rows={[
          { icon: 'storefront-outline', label: b.name, value: b.zoneName },
          { icon: 'bag-handle-outline', label: t('order.items', { count: itemCount }), value: formatMillimes(total, loc) },
          { icon: 'time-outline', label: t('order.pickup'), value: pickupLabel },
        ]}
        primaryLabel={t('booking.seeActivity')}
        onPrimary={() => router.replace('/activity')}
        secondaryLabel={t('common.close')}
        onSecondary={() => router.replace(`/business/${slug}`)}
      />
    );
  }

  const photo = b.coverImage ? { uri: b.coverImage } : categoryPhoto(b.categorySlug);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.headerPad}><BackHeader title={t('order.title')} /></View>
      <KeyboardScroll reserve={112} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Who you're ordering from */}
        <Animated.View entering={FadeInDown.duration(300)} style={[styles.shop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.shopThumb}>
            {photo ? (
              <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: `${accent}22` }]} />
            )}
          </View>
          <View style={{ flex: 1, marginHorizontal: spacing.md }}>
            <Text variant="bodyStrong" numberOfLines={1}>{b.name}</Text>
            <View style={[styles.shopMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Ionicons name="location" size={12} color={accent} />
              <Text variant="meta" muted numberOfLines={1} style={{ marginHorizontal: 4, flex: 1 }}>{b.zoneName}</Text>
            </View>
            <View style={[styles.payPill, { backgroundColor: `${accent}14` }]}>
              <Ionicons name="shield-checkmark" size={12} color={accent} />
              <Text variant="eyebrow" color={accent} style={styles.payText}>{t('order.payOnPickup')}</Text>
            </View>
          </View>
        </Animated.View>

        {hasUnique ? (
          <View style={[styles.uniqueNotice, { borderColor: accent, backgroundColor: `${accent}0D` }]}>
            <Ionicons name="diamond-outline" size={16} color={accent} />
            <Text variant="meta" color={accent} style={{ marginHorizontal: 6, flex: 1 }}>{t('order.uniqueNotice')}</Text>
          </View>
        ) : null}

        <Step n={1} title={t('order.selection')} accent={accent} />
        {products.map((p) => (
          <ProductRow key={p.id} p={p} qty={cart[p.id] ?? 0} max={maxFor(p)} accent={accent} loc={loc} onChange={(d) => setQty(p, d)} />
        ))}

        <Step n={2} title={t('order.pickupTime')} accent={accent} />
        <Pressable
          onPress={() => {
            haptics.tap();
            setPickupDate(null);
            setPickupTime(null);
          }}
          style={[styles.asap, asap && { borderColor: accent, backgroundColor: `${accent}0D` }, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          <Ionicons name="flash" size={16} color={asap ? accent : palette.mutedText} />
          <Text variant="bodyStrong" style={{ marginHorizontal: 8, flex: 1 }}>{t('order.asap')}</Text>
          <Ionicons name={asap ? 'radio-button-on' : 'radio-button-off'} size={20} color={asap ? accent : palette.border} />
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dayRow}>
          {dateOptions.map((d) => {
            const sel = pickupDate === d.iso;
            return (
              <Pressable
                key={d.iso}
                onPress={() => {
                  haptics.tap();
                  setPickupDate(d.iso);
                  if (!pickupTime) setPickupTime(TIMES[1]);
                }}
                style={[styles.dayTile, sel && { backgroundColor: accent, borderColor: accent }]}
              >
                <Text variant="meta" color={sel ? palette.white : palette.mutedText}>{d.weekday}</Text>
                <Text variant="section" color={sel ? palette.white : palette.ink}>{d.day}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {pickupDate ? (
          <Animated.View entering={FadeInDown.duration(220)} style={styles.timeRow}>
            {TIMES.map((tm) => {
              const sel = pickupTime === tm;
              return (
                <Pressable
                  key={tm}
                  onPress={() => {
                    haptics.tap();
                    setPickupTime(tm);
                  }}
                  style={[styles.timeChip, sel && { backgroundColor: accent, borderColor: accent }]}
                >
                  <Text variant="meta" color={sel ? palette.white : palette.ink} style={{ fontWeight: '700' }}>{tm}</Text>
                </Pressable>
              );
            })}
          </Animated.View>
        ) : null}

        <Step n={3} title={t('order.addNote')} accent={accent} />
        <Input value={note} onChangeText={setNote} placeholder={t('booking.notePlaceholder')} multiline />

        {errMsg ? (
          <View style={styles.errBox}>
            <Ionicons name="alert-circle" size={18} color={palette.errorRed} />
            <Text variant="meta" color={palette.errorRed} style={{ marginHorizontal: 8, flex: 1 }}>{errMsg}</Text>
          </View>
        ) : null}
      </KeyboardScroll>

      <GlassFooter>
        <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View>
            <Text variant="meta" muted>{t('order.items', { count: itemCount })}</Text>
            <Text variant="meta" muted numberOfLines={1}>{pickupLabel}</Text>
          </View>
          <Text variant="section" color={accent}>{formatMillimes(total, loc)}</Text>
        </View>
        <Button
          label={
            !user
              ? t('order.signInToOrder')
              : hasUnique
                ? t('order.reserveUnique')
                : lineCount > 0
                  ? t('order.cta', { total: formatMillimes(total, loc) })
                  : t('order.submit')
          }
          accent={accent}
          disabled={lineCount === 0}
          loading={submitting}
          onPress={submit}
        />
      </GlassFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.canvas },
  headerPad: { paddingHorizontal: spacing.lg },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 200 },
  shop: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radius.card,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#003F3A',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  shopThumb: { width: 66, height: 66, borderRadius: radius.input, overflow: 'hidden', backgroundColor: palette.surfaceAlt },
  shopMeta: { alignItems: 'center', marginTop: 2 },
  payPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill },
  payText: { fontSize: 10, lineHeight: 13, letterSpacing: 0.3, textTransform: 'none' },
  uniqueNotice: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.md },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl, marginBottom: spacing.md },
  stepDot: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 12, lineHeight: 14, letterSpacing: 0 },
  productRow: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: 'rgba(0,79,72,0.07)',
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  productIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  productBody: { flex: 1 },
  productMeta: { alignItems: 'center', gap: spacing.sm, marginTop: 3, flexWrap: 'wrap' },
  tag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  tagText: { fontSize: 9.5, lineHeight: 13, letterSpacing: 0.2, textTransform: 'none' },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.pill },
  stepper: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 4,
  },
  stepBtn: { width: 34, height: 36, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 24, textAlign: 'center' },
  asap: {
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radius.input,
    borderWidth: 1.5,
    borderColor: 'rgba(0,79,72,0.07)',
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  dayRow: { gap: spacing.sm, paddingVertical: spacing.xs },
  dayTile: {
    width: 62,
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: palette.white,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: 'rgba(0,79,72,0.07)',
  },
  timeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: 'rgba(0,79,72,0.07)',
  },
  errBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FBECEA', borderRadius: radius.input, padding: spacing.md, marginTop: spacing.sm },
  summaryRow: { justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
});
