import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { Rating } from '@/components/Rating';
import { AtelierCover } from './AtelierCover';
import { modeAccent, palette, radius, spacing } from '@/theme/tokens';
import { categoryIcon } from '@/lib/catalogIcons';
import { categoryPhoto } from '@/lib/categoryPhotos';
import { useCategoryLabel } from '@/hooks/useCategories';
import { categoryTone } from './CategoryGlyph';
import { formatMillimes } from '@/lib/format';
import { useLocale } from '@/hooks/useLocale';
import type { BusinessSummary } from '@/types';

type Variant = 'grid' | 'rail' | 'row';

/**
 * Business entry point shared by every concept. One aspect ratio per variant
 * keeps grids aligned; no fabricated ratings, prices or activity.
 */
export function BusinessTile({
  business: b,
  variant = 'grid',
  onPress,
  width,
}: {
  business: BusinessSummary;
  variant?: Variant;
  onPress: () => void;
  width?: number;
}) {
  const { t, locale, isRTL } = useLocale();
  const accent = modeAccent[b.primaryMode];
  const icon = categoryIcon(b.categorySlug);
  const categoryName = useCategoryLabel()(b.categorySlug);
  // The shop's own photo when it has one, otherwise a photo of its category.
  const photo = b.coverImage ? { uri: b.coverImage } : categoryPhoto(b.categorySlug);
  const row = { flexDirection: isRTL ? ('row-reverse' as const) : ('row' as const) };

  const price =
    b.primaryMode === 'APPOINTMENT' && b.nextSlotLabel
      ? `${t('business.nextSlot')} · ${b.nextSlotLabel}`
      : b.priceFromMillimes != null
        ? `${t('common.from')} ${formatMillimes(b.priceFromMillimes, locale)}`
        : t('common.payOnSite');

  if (variant === 'row') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${b.name}, ${b.zoneName}`}
        style={({ pressed }) => [styles.row, row, pressed && styles.pressed]}
      >
        <View style={styles.rowThumb}>
          {photo ? (
            <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <AtelierCover
              seed={b.slug}
              name={b.name}
              accent={accent}
              icon={icon}
              ratio={1}
              showMonogram={false}
            />
          )}
        </View>
        <View style={styles.rowBody}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {b.name}
          </Text>
          <Text variant="meta" muted numberOfLines={1} style={{ marginTop: 1 }}>
            {b.zoneName} · {t(`mode.${b.primaryMode}`)}
          </Text>
          <Text variant="meta" color={accent} numberOfLines={1} style={{ marginTop: 2 }}>
            {price}
          </Text>
        </View>
        <Rating avg={b.ratingAvg} count={b.ratingCount} size={12} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${b.name}, ${b.zoneName}`}
      style={({ pressed }) => [
        variant === 'rail' ? { width: width ?? 244 } : styles.grid,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.coverWrap}>
        {photo ? (
          <Image
            source={photo}
            style={[styles.cover, { aspectRatio: 1.5 }]}
            contentFit="cover"
            transition={160}
            cachePolicy="memory-disk"
            accessibilityLabel={b.name}
          />
        ) : (
          <AtelierCover seed={b.slug} name={b.name} accent={accent} icon={icon} ratio={1.5} />
        )}
        <View style={[styles.coverFooter, row]}>
          <View style={[styles.modePill, { backgroundColor: palette.white }]}>
            <Ionicons
              name={
                b.primaryMode === 'APPOINTMENT'
                  ? 'calendar-outline'
                  : b.primaryMode === 'ORDER'
                    ? 'bag-handle-outline'
                    : b.primaryMode === 'QUOTE'
                      ? 'document-text-outline'
                      : 'diamond-outline'
              }
              size={11}
              color={accent}
            />
            <Text variant="eyebrow" color={accent} style={{ marginStart: 4 }}>
              {t(`mode.${b.primaryMode}`)}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: spacing.sm }}>
        {categoryName ? (
          <Text variant="eyebrow" color={categoryTone(b.categorySlug)} numberOfLines={1} style={{ fontSize: 10, lineHeight: 13, fontWeight: '800' }}>
            {categoryName}
          </Text>
        ) : null}
        <Text variant="bodyStrong" numberOfLines={1}>
          {b.name}
        </Text>
        <View style={[styles.metaRow, row]}>
          <Ionicons name="location-outline" size={12} color={palette.mutedText} />
          <Text variant="meta" muted numberOfLines={1} style={{ marginStart: 3, flex: 1 }}>
            {b.zoneName}
            {b.shortDescription ? ` · ${b.shortDescription}` : ''}
          </Text>
        </View>
        <View style={[styles.metaRow, row, { justifyContent: 'space-between', marginTop: 4 }]}>
          <Text variant="meta" color={accent} numberOfLines={1} style={{ flex: 1 }}>
            {price}
          </Text>
          <Rating avg={b.ratingAvg} count={b.ratingCount} size={12} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { alignSelf: 'stretch' },
  pressed: { opacity: 0.85 },
  coverWrap: { borderRadius: radius.input, overflow: 'hidden' },
  cover: { width: '100%', backgroundColor: palette.surfaceAlt },
  coverFooter: { position: 'absolute', left: 8, bottom: 8 },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  metaRow: { alignItems: 'center', marginTop: 2 },
  row: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  rowThumb: { width: 56, height: 56, borderRadius: 14, overflow: 'hidden', backgroundColor: palette.surfaceAlt },
  rowBody: { flex: 1, marginHorizontal: spacing.md },
});
