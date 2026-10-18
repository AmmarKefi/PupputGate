import React from 'react';
import { View, StyleSheet, Pressable, ScrollView, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Glass } from '@/components/Glass';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ModeBadge } from '@/components/ModeBadge';
import { Rating } from '@/components/Rating';
import { CoverPlaceholder } from '@/components/CoverPlaceholder';
import { LoadingState, ErrorState } from '@/components/states';
import { palette, radius, spacing, modeAccent } from '@/theme/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/lib/api';
import { assetUrl } from '@/lib/assets';
import { categoryIcon } from '@/lib/catalogIcons';
import { categoryPhoto } from '@/lib/categoryPhotos';
import { useCategoryLabel } from '@/hooks/useCategories';
import { categoryTone } from '@/features/home/components/CategoryGlyph';
import { formatMillimes, minutesToLabel } from '@/lib/format';
import type { ProductItem, ServiceItem, CommerceMode } from '@/types';

const WEEKDAYS: Record<string, string[]> = {
  fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ar: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
};

export default function Storefront() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { t, locale, isRTL } = useLocale();
  const loc = locale as 'fr' | 'en' | 'ar';
  const space = useBottomSpace();
  const labelFor = useCategoryLabel();

  const { data, loading, error, refetch } = useQuery(() => api.business(String(slug)), { deps: [slug] });
  const reviews = useQuery(() => (data ? api.reviews(data.business.id) : Promise.resolve({ reviews: [] })), {
    enabled: !!data,
    deps: [data?.business.id],
  });

  if (loading) return <SafeAreaView style={styles.flex}><LoadingState /></SafeAreaView>;
  if (error || !data) return <SafeAreaView style={styles.flex}><ErrorState error={error} onRetry={refetch} /></SafeAreaView>;

  const b = data.business;
  const categoryLabel = labelFor(b.categorySlug);
  const accent = modeAccent[b.primaryMode];
  const offers = b.products.filter((p: ProductItem) => p.name.startsWith('[OFFRE'));
  const catalogProducts = b.products.filter((p: ProductItem) => !p.name.startsWith('[OFFRE'));
  const hasServices = b.modes.includes('APPOINTMENT') && b.services.length > 0;
  const hasProducts = (b.modes.includes('ORDER') || b.modes.includes('SHOWCASE')) && catalogProducts.length > 0;
  const hasOffers = offers.length > 0;
  const hasQuote = b.modes.includes('QUOTE');

  function primaryAction(): { label: string; onPress: () => void } | null {
    if (b.modes.includes('APPOINTMENT')) return { label: t('business.book'), onPress: () => router.push(`/booking/${b.slug}`) };
    if (b.modes.includes('SHOWCASE')) return { label: t('business.reserve'), onPress: () => router.push(`/order/${b.slug}`) };
    if (b.modes.includes('ORDER')) return { label: t('business.order'), onPress: () => router.push(`/order/${b.slug}`) };
    if (hasQuote) return { label: t('business.requestQuote'), onPress: () => router.push(`/quote/${b.slug}`) };
    if (hasOffers) return { label: 'Voir les offres', onPress: () => router.push(`/order/${b.slug}`) };
    return null;
  }
  const action = primaryAction();

  function directions() {
    if (b.latitude == null || b.longitude == null) return;
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${b.latitude},${b.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`,
    });
    Linking.openURL(url!).catch(() => {});
  }

  const coverUri = assetUrl(b.coverImage);

  return (
    <View style={styles.flex}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: action ? space.system + 112 : space.system + 32 }}>
        {/* Cover */}
        <View>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.cover} contentFit="cover" />
          ) : categoryPhoto(b.categorySlug) ? (
            <Image source={categoryPhoto(b.categorySlug)!} style={styles.cover} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <CoverPlaceholder name={b.name} mode={b.primaryMode} icon={categoryIcon(b.categorySlug)} height={280} />
          )}
          <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.28)', 'rgba(0,0,0,0)']} style={styles.coverScrim} />
          <SafeAreaView edges={['top']} style={styles.coverOverlay} pointerEvents="box-none">
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: spacing.sm }}>
              <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('common.back')}>
                <Glass radius={22} shadow={false} intensity={60}>
                  <View style={styles.circleBtn}>
                    <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={palette.ink} />
                  </View>
                </Glass>
              </Pressable>
              {user?.role === 'MERCHANT' ? (
                <Pressable
                  onPress={() => router.push({ pathname: '/activity', params: { seg: 'storefront' } })}
                  accessibilityRole="button"
                  accessibilityLabel={t('merchant.manage')}
                >
                  <Glass radius={22} shadow={false} intensity={70}>
                    <View style={styles.ownerManageBtn}>
                      <Ionicons name="sparkles" size={15} color={palette.forest} />
                      <Text variant="meta" color={palette.forest} style={{ fontWeight: '800', marginStart: 5 }}>
                        {t('merchant.manage')}
                      </Text>
                    </View>
                  </Glass>
                </Pressable>
              ) : null}
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <View style={[styles.badgeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {categoryLabel ? (
              <View style={[styles.catChip, { backgroundColor: `${categoryTone(b.categorySlug)}1A`, marginEnd: spacing.sm }]}>
                <Text variant="eyebrow" color={categoryTone(b.categorySlug)} style={{ fontSize: 10.5, fontWeight: '800' }}>
                  {categoryLabel}
                </Text>
              </View>
            ) : null}
            {b.modes.map((m: CommerceMode) => (
              <View key={m} style={{ marginEnd: spacing.sm }}>
                <ModeBadge mode={m} small />
              </View>
            ))}
          </View>
          <Text variant="title" style={{ marginTop: spacing.sm }}>
            {b.name}
          </Text>
          <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Ionicons name="location-outline" size={14} color={palette.mutedText} />
            <Text variant="meta" muted style={{ marginHorizontal: 4 }}>
              {b.zoneName}
            </Text>
            <Rating avg={b.ratingAvg} count={b.ratingCount} />
          </View>

          {b.description ? (
            <>
              <SectionTitle title={t('business.about')} />
              <Text variant="body" muted>{b.description}</Text>
            </>
          ) : null}

          {/* Offers & Promotions */}
          {hasOffers ? (
            <>
              <SectionTitle title="Offres & Promotions" />
              {offers.map((o: ProductItem) => {
                const match = o.name.match(/^\[OFFRE:\s*([^\]]+)\]\s*(.*)$/);
                const badge = match ? match[1] : 'PROMO';
                const cleanTitle = match ? match[2] : o.name;
                const imgUrl = assetUrl(o.image);
                return (
                  <Card
                    key={o.id}
                    style={styles.offerItem}
                    onPress={() => router.push(`/order/${b.slug}?productId=${o.id}`)}
                    accessibilityLabel={cleanTitle}
                  >
                    <View style={[styles.rowBetween, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      {imgUrl ? (
                        <Image source={{ uri: imgUrl }} style={styles.productThumb} contentFit="cover" />
                      ) : (
                        <View style={[styles.productThumb, { backgroundColor: '#FFF0EA', alignItems: 'center', justifyContent: 'center' }]}>
                          <Ionicons name="sparkles" size={24} color="#FF6A3D" />
                        </View>
                      )}
                      <View style={{ flex: 1, paddingHorizontal: spacing.xs }}>
                        <View style={styles.offerPill}>
                          <Text variant="eyebrow" color="#FF6A3D" style={{ fontWeight: '800' }}>
                            {badge}
                          </Text>
                        </View>
                        <Text variant="bodyStrong" style={{ marginTop: 2, fontSize: 15 }}>
                          {cleanTitle}
                        </Text>
                        {o.description ? (
                          <Text variant="meta" muted numberOfLines={2} style={{ marginTop: 2 }}>
                            {o.description}
                          </Text>
                        ) : null}
                        {o.priceMillimes > 0 ? (
                          <Text variant="meta" color="#FF6A3D" style={{ marginTop: 4, fontWeight: '800' }}>
                            {formatMillimes(o.priceMillimes, loc)}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color="#FF6A3D" />
                    </View>
                  </Card>
                );
              })}
            </>
          ) : null}

          {/* Services */}
          {hasServices ? (
            <>
              <SectionTitle title={t('business.services')} />
              {b.services.map((s: ServiceItem) => (
                <Card key={s.id} style={styles.listItem} onPress={() => router.push(`/booking/${b.slug}?serviceId=${s.id}`)} accessibilityLabel={s.name}>
                  <View style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong">{s.name}</Text>
                      {s.description ? <Text variant="meta" muted numberOfLines={1}>{s.description}</Text> : null}
                      <Text variant="meta" color={accent} style={{ marginTop: 4 }}>
                        {s.durationMin} {t('booking.min')} · {formatMillimes(s.priceMillimes, loc)}
                      </Text>
                    </View>
                    <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={palette.mutedText} />
                  </View>
                </Card>
              ))}
            </>
          ) : null}

          {/* Products */}
          {hasProducts ? (
            <>
              <SectionTitle title={t('business.products')} />
              {catalogProducts.map((p: ProductItem) => (
                <ProductRow key={p.id} product={p} accent={accent} loc={loc}
                  onPress={() => router.push(`/order/${b.slug}?productId=${p.id}`)} />
              ))}
            </>
          ) : null}

          {/* Quote CTA block */}
          {hasQuote && !hasServices && !hasProducts ? (
            <Card style={{ marginTop: spacing.lg, backgroundColor: palette.mint }}>
              <Text variant="bodyStrong">{t('business.requestQuote')}</Text>
              {b.serviceArea ? (
                <Text variant="meta" muted style={{ marginTop: 4 }}>
                  {t('business.serviceArea')}: {b.serviceArea}
                </Text>
              ) : null}
            </Card>
          ) : null}

          {/* Hours */}
          <SectionTitle title={t('business.hours')} />
          <Card>
            {[...b.openingHours].sort((a, c) => a.weekday - c.weekday).map((h) => (
              <View key={h.weekday} style={[styles.hourRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text variant="body">{WEEKDAYS[loc][h.weekday]}</Text>
                <Text variant="body" muted>
                  {h.openMinute != null && h.closeMinute != null
                    ? `${minutesToLabel(h.openMinute)} – ${minutesToLabel(h.closeMinute)}`
                    : t('business.closed')}
                </Text>
              </View>
            ))}
          </Card>

          {/* Location */}
          <SectionTitle title={t('business.location')} />
          <Card>
            {b.hideExactLocation ? (
              <Text variant="body">
                {t('business.serviceArea')}: {b.serviceArea ?? b.zoneName}
              </Text>
            ) : (
              <>
                {b.address ? <Text variant="body">{b.address}</Text> : <Text variant="body">{b.zoneName}</Text>}
                {b.latitude != null ? (
                  <Button label={t('map.directions')} icon="navigate-outline" variant="secondary" fullWidth={false} onPress={directions} style={{ marginTop: spacing.md }} />
                ) : null}
              </>
            )}
            {b.phone ? (
              <Button label={t('business.call')} icon="call-outline" variant="ghost" fullWidth={false} onPress={() => Linking.openURL(`tel:${b.phone}`)} style={{ marginTop: spacing.sm }} />
            ) : null}
          </Card>

          {/* Reviews */}
          {(reviews.data?.reviews.length ?? 0) > 0 ? (
            <>
              <SectionTitle title={t('business.reviews')} />
              <Text variant="meta" muted style={{ marginBottom: spacing.sm }}>
                {t('business.reviewsDemo')}
              </Text>
              {reviews.data!.reviews.slice(0, 3).map((r) => (
                <Card key={r.id} style={styles.listItem}>
                  <Text variant="meta" color={palette.sand}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                  {r.comment ? <Text variant="body" style={{ marginTop: 4 }}>{r.comment}</Text> : null}
                  <Text variant="meta" muted style={{ marginTop: 4 }}>{r.authorName}</Text>
                </Card>
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky footer action */}
      {action ? (
        <View style={[styles.footer, { bottom: Math.max(space.system, spacing.sm) }]} pointerEvents="box-none">
          <Glass radius={30} intensity={80}>
            <View style={styles.footerInner}>
              {!b.acceptingBookings && b.modes.includes('APPOINTMENT') ? (
                <Text variant="meta" color={palette.errorRed} center style={{ marginBottom: spacing.sm }}>
                  {t('business.bookingsPaused')}
                </Text>
              ) : null}
              <Button
                label={action.label}
                accent={accent}
                onPress={action.onPress}
                disabled={b.modes.includes('APPOINTMENT') && !b.acceptingBookings}
              />
            </View>
          </Glass>
        </View>
      ) : null}
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text variant="section" style={{ marginTop: spacing.xl, marginBottom: spacing.md }}>
      {title}
    </Text>
  );
}

function ProductRow({
  product: p, accent, loc, onPress,
}: {
  product: ProductItem;
  accent: string;
  loc: 'fr' | 'en' | 'ar';
  onPress: () => void;
}) {
  const { t, isRTL } = useLocale();
  const disabled = p.stockStatus === 'OUT_OF_STOCK';
  const imgUrl = assetUrl(p.image);
  const stockLabel =
    p.stockStatus === 'UNIQUE_PIECE' ? t('business.uniquePiece')
    : p.stockStatus === 'OUT_OF_STOCK' ? t('business.outOfStock')
    : p.stockStatus === 'MADE_TO_ORDER' ? t('business.madeToOrder')
    : t('business.inStock');
  return (
    <Card style={[styles.listItem, disabled && { opacity: 0.6 }]} onPress={disabled ? undefined : onPress} accessibilityLabel={p.name}>
      <View style={[styles.rowBetween, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {imgUrl ? (
          <Image source={{ uri: imgUrl }} style={styles.productThumb} contentFit="cover" />
        ) : null}
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">{p.name}</Text>
          {p.description ? <Text variant="meta" muted numberOfLines={1}>{p.description}</Text> : null}
          <View style={[styles.stockRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.stockTag, p.stockStatus === 'UNIQUE_PIECE' && { backgroundColor: `${accent}1A` }]}>
              <Text variant="eyebrow" color={p.stockStatus === 'OUT_OF_STOCK' ? palette.errorRed : accent}>
                {stockLabel}
              </Text>
            </View>
            <Text variant="meta" color={accent}>{formatMillimes(p.priceMillimes, loc)}</Text>
          </View>
        </View>
        {!disabled ? <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={palette.mutedText} /> : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.canvas },
  cover: { width: '100%', height: 280, backgroundColor: palette.surfaceAlt },
  coverScrim: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },
  coverOverlay: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.lg },
  circleBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  ownerManageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
  },
  productThumb: { width: 56, height: 56, borderRadius: radius.card, backgroundColor: palette.surfaceAlt, marginEnd: spacing.sm },
  body: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    marginTop: -32,
    backgroundColor: palette.canvas,
    borderTopLeftRadius: radius.editorial,
    borderTopRightRadius: radius.editorial,
  },
  badgeRow: { flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  catChip: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 99 },
  metaRow: { alignItems: 'center', marginTop: spacing.sm, gap: spacing.sm },
  listItem: { marginBottom: spacing.sm },
  offerItem: {
    padding: spacing.md + 2,
    marginBottom: spacing.sm,
    borderColor: 'rgba(255,106,61,0.22)',
    borderWidth: 1,
    backgroundColor: '#FFFAF8',
  },
  offerPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: '#FFF0EA',
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  hourRow: { justifyContent: 'space-between', paddingVertical: 6 },
  stockRow: { alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  stockTag: { backgroundColor: palette.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  footer: { position: 'absolute', left: spacing.sm, right: spacing.sm },
  footerInner: { padding: spacing.md },
});
