import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/lib/haptics';
import { Text } from './Text';
import { Card } from './Card';
import { CoverPlaceholder } from './CoverPlaceholder';
import { palette, spacing, modeAccent, radius } from '@/theme/tokens';
import { formatMillimes } from '@/lib/format';
import { categoryIcon } from '@/lib/catalogIcons';
import { categoryPhoto } from '@/lib/categoryPhotos';
import { assetUrl } from '@/lib/assets';
import { useLocale } from '@/hooks/useLocale';
import { useCategoryLabel } from '@/hooks/useCategories';
import { categoryTone } from '@/features/home/components/CategoryGlyph';
import type { BusinessSummary, CommerceMode } from '@/types';

interface Props {
  business: BusinessSummary;
  onPress: () => void;
  onToggleFavourite?: () => void;
}

const MODE_ICON: Record<CommerceMode, keyof typeof Ionicons.glyphMap> = {
  APPOINTMENT: 'calendar',
  ORDER: 'bag-handle',
  SHOWCASE: 'diamond',
  QUOTE: 'document-text',
};

const COVER_HEIGHT = 172;

function BusinessCardBase({ business: b, onPress, onToggleFavourite }: Props) {
  const { t, locale, isRTL } = useLocale();
  const accent = modeAccent[b.primaryMode];
  const icon = categoryIcon(b.categorySlug);
  const fallbackPhoto = categoryPhoto(b.categorySlug);
  const categoryName = useCategoryLabel()(b.categorySlug);
  const row = { flexDirection: isRTL ? ('row-reverse' as const) : ('row' as const) };

  const offer =
    b.primaryMode === 'APPOINTMENT' && b.nextSlotLabel
      ? { icon: 'time-outline' as const, text: `${t('business.nextSlot')} · ${b.nextSlotLabel}` }
      : b.priceFromMillimes != null
        ? { icon: 'pricetag-outline' as const, text: `${t('common.from')} ${formatMillimes(b.priceFromMillimes, locale)}` }
        : { icon: 'cash-outline' as const, text: t('common.payOnSite') };

  const hasRating = b.ratingAvg != null && b.ratingCount > 0;
  const coverUri = assetUrl(b.coverImage);

  return (
    <Card onPress={onPress} padded={false} raised style={styles.card} accessibilityLabel={b.name}>
      <View>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={styles.cover} contentFit="cover" transition={150} />
        ) : fallbackPhoto ? (
          <Image source={fallbackPhoto} style={styles.cover} contentFit="cover" transition={150} cachePolicy="memory-disk" />
        ) : (
          <CoverPlaceholder name={b.name} mode={b.primaryMode} icon={icon} height={COVER_HEIGHT} />
        )}
        <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.30)', 'rgba(0,0,0,0)']} style={styles.scrimTop} />
        <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.5)']} style={styles.scrimBottom} />

        {/* Top row: which ways you can use the shop, and favourite. */}
        <View pointerEvents="box-none" style={[styles.topRow, row]}>
          <View style={[styles.modes, row]}>
            {b.modes.slice(0, 4).map((m) => (
              <View key={m} style={[styles.modeDot, { backgroundColor: modeAccent[m] }]}>
                <Ionicons name={MODE_ICON[m]} size={13} color={palette.white} />
              </View>
            ))}
          </View>
          {onToggleFavourite ? (
            <Pressable
              onPress={() => {
                haptics.tap();
                onToggleFavourite();
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('business.favourite')}
              style={styles.fav}
            >
              <Ionicons
                name={b.isFavourite ? 'heart' : 'heart-outline'}
                size={20}
                color={b.isFavourite ? palette.terracotta : palette.ink}
              />
            </Pressable>
          ) : null}
        </View>

        {/* Bottom row: rating and place, readable on any photo. */}
        <View pointerEvents="none" style={[styles.bottomRow, row]}>
          {hasRating ? (
            <View style={[styles.chip, styles.chipLight, row]}>
              <Ionicons name="star" size={12} color="#F2A900" />
              <Text variant="meta" color={palette.ink} style={styles.chipText}>
                {b.ratingAvg!.toFixed(1)}
              </Text>
              <Text variant="meta" muted style={{ marginStart: 3 }}>
                ({b.ratingCount})
              </Text>
            </View>
          ) : (
            <View />
          )}
          <View style={[styles.chip, styles.chipDark, row]}>
            <Ionicons name="location" size={12} color={palette.white} />
            <Text variant="meta" color={palette.white} numberOfLines={1} style={styles.chipText}>
              {b.zoneName}
              {b.distanceKm != null ? ` · ${b.distanceKm} ${t('common.km')}` : ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {categoryName ? (
          <View style={[styles.catRow, row]}>
            <View style={[styles.catDot, { backgroundColor: categoryTone(b.categorySlug) }]} />
            <Text variant="eyebrow" color={categoryTone(b.categorySlug)} numberOfLines={1} style={styles.catText}>
              {categoryName}
            </Text>
          </View>
        ) : null}
        <Text variant="section" numberOfLines={1}>
          {b.name}
        </Text>
        {b.shortDescription ? (
          <Text variant="meta" muted numberOfLines={2} style={styles.desc}>
            {b.shortDescription}
          </Text>
        ) : null}

        <View style={[styles.footer, row]}>
          <View style={[styles.offer, { backgroundColor: `${accent}14` }, row]}>
            <Ionicons name={offer.icon} size={14} color={accent} />
            <Text variant="meta" color={accent} numberOfLines={1} style={styles.offerText}>
              {offer.text}
            </Text>
          </View>
          {!b.acceptingBookings ? (
            <Text variant="meta" color={palette.errorRed} numberOfLines={1}>
              {t('business.bookingsPaused')}
            </Text>
          ) : (
            <View style={[styles.go, { backgroundColor: accent }]}>
              <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={16} color={palette.white} />
            </View>
          )}
        </View>
      </View>
    </Card>
  );
}

export const BusinessCard = React.memo(BusinessCardBase);

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg, borderRadius: radius.editorial - 4 },
  cover: { width: '100%', height: COVER_HEIGHT, backgroundColor: palette.surfaceAlt },
  scrimTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 70 },
  scrimBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  topRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modes: { gap: 6 },
  modeDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  fav: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.93)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chip: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, flexShrink: 1 },
  chipLight: { backgroundColor: 'rgba(255,255,255,0.94)' },
  chipDark: { backgroundColor: 'rgba(0,40,36,0.55)' },
  chipText: { marginStart: 4, fontWeight: '700' },
  body: { padding: spacing.lg + 2, paddingTop: spacing.md + 2 },
  desc: { marginTop: 3 },
  catRow: { alignItems: 'center', marginBottom: 4 },
  catDot: { width: 7, height: 7, borderRadius: 4 },
  catText: { marginStart: 6, fontSize: 10.5, lineHeight: 14, letterSpacing: 0.6, fontWeight: '800' },
  footer: { alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md + 2, gap: spacing.md },
  offer: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, flexShrink: 1 },
  offerText: { marginStart: 6, fontWeight: '700', flexShrink: 1 },
  go: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
