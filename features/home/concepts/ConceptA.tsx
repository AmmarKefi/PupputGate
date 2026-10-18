import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { palette, radius, spacing } from '@/theme/tokens';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useLocale } from '@/hooks/useLocale';
import { useBreakpoint, useColumns, useGutter } from '@/features/home/layout';
import { useHomeCopy } from '@/features/home/copy';
import { useHomeActions } from '@/features/home/useHomeNav';
import {
  BusinessTile,
  CategoryRail,
  EmptyHome,
  HomeHeader,
  MiniMap,
  ProBanner,
  SearchField,
} from '@/features/home/components';
import type { HomeConceptProps } from '@/features/home/types';

type Mode = 'map' | 'list';

/**
 * Concept A — The Local Discovery Map.
 * Hammamet is the organising idea: one filtered set of businesses drives the
 * map, the rail and the grid, so nothing on screen disagrees with anything else.
 */
export function ConceptA({ guest, data }: HomeConceptProps) {
  const { t, isRTL } = useLocale();
  const copy = useHomeCopy();
  const actions = useHomeActions();
  const space = useBottomSpace();
  const bp = useBreakpoint();
  const columns = useColumns(1, 2, 3);
  const gutter = useGutter();

  const [term, setTerm] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('map');

  const filtered = useMemo(
    () => (category ? data.businesses.filter((b) => b.categorySlug === category) : data.businesses),
    [data.businesses, category],
  );

  const cardWidth = columns === 1 ? '100%' : columns === 2 ? '48.2%' : '31.6%';
  const row = { flexDirection: isRTL ? ('row-reverse' as const) : ('row' as const) };
  const empty = data.businesses.length === 0;

  return (
    <View style={styles.flex}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: space.scroll }}
        >
          {/* Hero band: identity, promise, search, two ways in. */}
          <View style={[styles.band, { paddingHorizontal: gutter }]}>
            <HomeHeader guest={guest} tone="dark" />

            <Text variant="eyebrow" color={palette.sand} style={{ marginTop: spacing.xxl }}>
              Hammamet
            </Text>
            <Text variant="title" color={palette.white} style={styles.headline}>
              {copy.aHeadline}
            </Text>
            <Text variant="body" color="rgba(255,255,255,0.82)" style={{ marginTop: spacing.sm }}>
              {copy.aSupport}
            </Text>

            <View style={{ marginTop: spacing.xl }}>
              <SearchField
                value={term}
                onChangeText={setTerm}
                onSubmit={() => actions.search(term)}
                placeholder={t('home.searchPlaceholder')}
                tone="dark"
              />
            </View>

            <View style={[styles.ctaRow, row]}>
              <Pressable
                onPress={actions.openMap}
                accessibilityRole="button"
                accessibilityLabel={copy.aExplore}
                style={({ pressed }) => [styles.ctaPrimary, pressed && styles.pressed]}
              >
                <Ionicons name="map" size={17} color={palette.deepGreen} />
                <Text variant="bodyStrong" color={palette.deepGreen} style={{ marginStart: 6 }}>
                  {copy.aExplore}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => actions.explore({})}
                accessibilityRole="button"
                accessibilityLabel={copy.aServices}
                style={({ pressed }) => [styles.ctaGhost, pressed && styles.pressed]}
              >
                <Text variant="bodyStrong" color={palette.white}>
                  {copy.aServices}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Sheet overlapping the band. */}
          <View style={[styles.sheet, { paddingHorizontal: gutter }]}>
            {empty ? (
              <EmptyHome guest={guest} />
            ) : (
              <>
                <CategoryRail
                  categories={data.categories}
                  categoryName={data.categoryName}
                  selected={category}
                  onSelect={setCategory}
                />

                <View style={[styles.modeRow, row]}>
                  <View style={[styles.segmented, row]}>
                    <Pressable
                      onPress={() => setMode('map')}
                      accessibilityRole="button"
                      accessibilityState={{ selected: mode === 'map' }}
                      style={[styles.segment, mode === 'map' && styles.segmentActive]}
                    >
                      <Ionicons
                        name="map-outline"
                        size={14}
                        color={mode === 'map' ? palette.forest : palette.mutedText}
                      />
                      <Text
                        variant="meta"
                        color={mode === 'map' ? palette.forest : palette.mutedText}
                        style={{ marginStart: 5, fontWeight: '600' }}
                      >
                        {copy.aMap}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setMode('list')}
                      accessibilityRole="button"
                      accessibilityState={{ selected: mode === 'list' }}
                      style={[styles.segment, mode === 'list' && styles.segmentActive]}
                    >
                      <Ionicons
                        name="list-outline"
                        size={14}
                        color={mode === 'list' ? palette.forest : palette.mutedText}
                      />
                      <Text
                        variant="meta"
                        color={mode === 'list' ? palette.forest : palette.mutedText}
                        style={{ marginStart: 5, fontWeight: '600' }}
                      >
                        {copy.aList}
                      </Text>
                    </Pressable>
                  </View>
                  <Pressable
                    onPress={actions.openMap}
                    accessibilityRole="button"
                    accessibilityLabel={t('explore.map')}
                    hitSlop={8}
                  >
                    <Text variant="meta" color={palette.forest} style={{ fontWeight: '700' }}>
                      {t('explore.map')} →
                    </Text>
                  </Pressable>
                </View>

                {mode === 'map' ? (
                  <View style={{ marginTop: spacing.sm }}>
                    <MiniMap
                      businesses={filtered}
                      onSelect={actions.openBusiness}
                      height={bp === 'compact' ? 240 : 340}
                      // Pins stay tappable, but the map must not swallow the
                      // page's vertical scroll. Full pan/zoom lives in /map.
                      interactive={false}
                    />
                    <Text variant="meta" muted style={{ marginTop: spacing.xs }}>
                      {copy.mapHint}
                    </Text>
                  </View>
                ) : (
                  <View style={{ marginTop: spacing.sm }}>
                    {filtered.map((b) => (
                      <BusinessTile
                        key={b.id}
                        business={b}
                        variant="row"
                        onPress={() => actions.openBusiness(b)}
                      />
                    ))}
                  </View>
                )}

                {/* Rail: same filtered set, quick horizontal scan. */}
                <View style={styles.sectionHead}>
                  <Text variant="section">{copy.nearby}</Text>
                  <Pressable
                    onPress={() => actions.explore(category ? { category } : {})}
                    accessibilityRole="button"
                    hitSlop={8}
                  >
                    <Text variant="meta" color={palette.forest} style={{ fontWeight: '700' }}>
                      {t('common.seeAll')}
                    </Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.rail}
                >
                  {filtered.slice(0, 8).map((b) => (
                    <BusinessTile
                      key={b.id}
                      business={b}
                      variant="rail"
                      width={bp === 'compact' ? 232 : 268}
                      onPress={() => actions.openBusiness(b)}
                    />
                  ))}
                </ScrollView>

                <View style={styles.sectionHead}>
                  <Text variant="section">{copy.aAddresses}</Text>
                </View>
                <View style={styles.grid}>
                  {filtered.slice(0, 6).map((b) => (
                    <View key={b.id} style={{ width: cardWidth, marginBottom: spacing.xl }}>
                      <BusinessTile business={b} onPress={() => actions.openBusiness(b)} />
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={{ marginTop: spacing.lg }}>
              <ProBanner onPress={() => actions.joinPro(guest)} variant="dark" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.canvas },
  band: {
    backgroundColor: palette.deepGreen,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl + spacing.xl,
  },
  headline: { marginTop: spacing.sm, maxWidth: 560 },
  ctaRow: { marginTop: spacing.xl, gap: spacing.sm, flexWrap: 'wrap' },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.sand,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
  },
  ctaGhost: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
  },
  pressed: { opacity: 0.85 },
  sheet: {
    marginTop: -spacing.xxl,
    backgroundColor: palette.canvas,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: spacing.xl,
  },
  modeRow: { alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg },
  segmented: {
    backgroundColor: 'rgba(37,53,47,0.06)',
    borderRadius: radius.pill,
    padding: 3,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  segmentActive: {
    backgroundColor: palette.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.border,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  rail: { gap: spacing.lg, paddingEnd: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
