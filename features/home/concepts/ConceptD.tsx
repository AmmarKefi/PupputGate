import React, { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Text } from '@/components/Text';
import { SectionHeader } from '@/components/SectionHeader';
import { useLocale } from '@/hooks/useLocale';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useSearchTransition } from '@/hooks/useSearchTransition';
import { brandTeal, modeAccent, palette, radius, spacing } from '@/theme/tokens';
import {
  BusinessTile,
  CategoryBubbles,
  EmptyHome,
  ProBanner,
  SearchField,
} from '@/features/home/components';
import { useBreakpoint, useColumns, useContentMaxWidth, useGutter } from '@/features/home/layout';
import { useHomeCopy } from '@/features/home/copy';
import { useHomeActions } from '@/features/home/useHomeNav';
import { CategorySheet } from '@/features/home/components/CategorySheet';
import type { CommerceMode } from '@/types';
import type { HomeConceptProps } from '@/features/home/types';

type IconName = keyof typeof Ionicons.glyphMap;

interface Path {
  mode: CommerceMode;
  title: string;
  desc: string;
  accent: string;
  icon: IconName;
}

/**
 * Concept D — bright teal discovery header (location, search, category
 * collage) over a curved white sheet. Tapping the search field expands it into
 * the Explore screen. All listings and categories come from the real API.
 */
export function ConceptD({ guest, data }: HomeConceptProps) {
  const { t, isRTL } = useLocale();
  const copy = useHomeCopy();
  const actions = useHomeActions();
  const bp = useBreakpoint();
  const gutter = useGutter();
  const columns = useColumns(1, 2, 3);
  const maxWidth = useContentMaxWidth();
  const space = useBottomSpace();
  const [term, setTerm] = useState('');
  // Tapping a category opens its shops in a sheet, right here on Home.
  const [sheetSlug, setSheetSlug] = useState<string | null>(null);
  const sheetCategory = data.categories.find((c) => c.slug === sheetSlug);
  const sheetBusinesses = data.businesses.filter((b) => b.categorySlug === sheetSlug);
  const router = useRouter();
  const { data: notif } = useQuery(() => api.notifications(), { enabled: !guest, pollMs: 30000 });
  const unread = notif?.unread ?? 0;

  const compact = bp === 'compact';
  const featured = data.businesses.slice(0, 8);
  const itemWidth = columns === 1 ? '100%' : columns === 2 ? '48.2%' : '31.6%';
  const row = { flexDirection: isRTL ? ('row-reverse' as const) : ('row' as const) };

  // Search → Explore: the shared transition stretches the field to Explore.
  const { start: startSearch } = useSearchTransition();
  const searchRef = useRef<View>(null);
  const openSearch = useCallback(() => {
    searchRef.current?.measureInWindow((x, y, w, h) => startSearch({ x, y, w, h }, term.trim()));
  }, [startSearch, term]);

  const paths: Path[] = [
    {
      mode: 'APPOINTMENT',
      title: copy.dBook,
      desc: copy.dBookDesc,
      accent: modeAccent.APPOINTMENT,
      icon: 'calendar-outline',
    },
    {
      mode: 'ORDER',
      title: copy.dOrder,
      desc: copy.dOrderDesc,
      accent: modeAccent.ORDER,
      icon: 'bag-handle-outline',
    },
    {
      mode: 'QUOTE',
      title: copy.dPro,
      desc: copy.dProDesc,
      accent: modeAccent.QUOTE,
      icon: 'construct-outline',
    },
  ];

  const pathsBlock = (
    <View style={styles.pathSection}>
      <Text variant="section">{t('howItWorks.title')}</Text>
      <View style={compact ? styles.pathsCompact : [styles.pathRow, row]}>
        {paths.map((path) => (
          <Pressable
            key={path.mode}
            onPress={() => actions.explore({ mode: path.mode })}
            accessibilityRole="button"
            accessibilityLabel={`${path.title} — ${path.desc}`}
            style={({ pressed }) => [
              compact ? styles.pathCompact : styles.path,
              { backgroundColor: `${path.accent}12` },
              compact && row,
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.pathIcon, { backgroundColor: path.accent }]}>
              <Ionicons name={path.icon} size={18} color={palette.white} />
            </View>
            <View style={compact ? styles.pathCompactBody : undefined}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {path.title}
              </Text>
              <Text variant="meta" muted numberOfLines={2} style={styles.pathDesc}>
                {path.desc}
              </Text>
            </View>
            {compact ? (
              <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={17} color={path.accent} />
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safe}>
        {/* Match the reference's white iOS/Android status glyphs on teal. */}
        <StatusBar style="light" animated />
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: space.scroll }}
        >
          {/* Full-bleed teal header: location, search, then the category collage. */}
          <View style={styles.hero}>
            <View
              style={[
                styles.heroInner,
                { paddingHorizontal: gutter, maxWidth, alignSelf: 'center', width: '100%' },
              ]}
            >
              <View style={[styles.header, row]}>
                <Pressable
                  onPress={actions.openMap}
                  accessibilityRole="button"
                  accessibilityLabel={`${copy.nearby} — ${t('welcome.location')}`}
                  style={styles.locationBlock}
                >
                  <Text variant="meta" color="rgba(255,255,255,0.85)">
                    {copy.nearby}
                  </Text>
                  <Text variant="section" color={palette.white} numberOfLines={1} style={styles.locationName}>
                    {t('welcome.location')}
                  </Text>
                </Pressable>
                {!guest ? (
                  <Pressable
                    onPress={() => router.push('/notifications')}
                    accessibilityRole="button"
                    accessibilityLabel={t('account.notifications')}
                    hitSlop={10}
                    style={styles.bell}
                  >
                    <Ionicons name="notifications-outline" size={28} color={palette.white} />
                    {unread > 0 ? (
                      <View style={styles.badge}>
                        <Text variant="eyebrow" color={palette.white} style={styles.badgeText}>
                          {unread > 9 ? '9+' : String(unread)}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                ) : null}
              </View>

              {/* The field is a button here: tapping it expands into Explore. */}
              <View ref={searchRef} collapsable={false} style={styles.searchWrap}>
                <View pointerEvents="none">
                  <SearchField
                    value={term}
                    onChangeText={setTerm}
                    onSubmit={openSearch}
                    placeholder={t('home.searchPlaceholder')}
                    tone="light"
                    size="lg"
                    shape="card"
                  />
                </View>
                <Pressable
                  onPress={openSearch}
                  accessibilityRole="search"
                  accessibilityLabel={t('home.searchPlaceholder')}
                  style={StyleSheet.absoluteFill}
                />
              </View>

              <View style={styles.categoryBlock}>
                {data.categories.length > 0 ? (
                  <CategoryBubbles
                    categories={data.categories}
                    categoryName={data.categoryName}
                    onSelect={(slug) => setSheetSlug(slug)}
                  />
                ) : (
                  <Pressable onPress={() => actions.explore()} style={styles.browseAll}>
                    <Text variant="meta" color={palette.white}>
                      {t('common.seeAll')}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          {/* Curved white sheet, like the reference: a wide arc with a grab handle. */}
          <View style={styles.arc}>
            <View style={styles.handle} accessibilityElementsHidden importantForAccessibility="no" />
          </View>
          <View
            style={[
              styles.sheet,
              { paddingHorizontal: gutter, maxWidth, alignSelf: 'center', width: '100%' },
            ]}
          >
            {data.businesses.length === 0 ? (
              <>
                {pathsBlock}
                <EmptyHome guest={guest} />
              </>
            ) : (
              <>
                <SectionHeader
                  title={copy.dBusinesses}
                  actionLabel={t('common.seeAll')}
                  onAction={() => actions.explore()}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.businessRail}
                  decelerationRate="fast"
                  snapToInterval={(compact ? 248 : 284) + spacing.lg}
                >
                  {featured.slice(0, 6).map((business) => (
                    <BusinessTile
                      key={business.id}
                      business={business}
                      variant="rail"
                      width={compact ? 248 : 284}
                      onPress={() => actions.openBusiness(business)}
                    />
                  ))}
                </ScrollView>

                {pathsBlock}

                <SectionHeader
                  title={t('explore.title')}
                  actionLabel={t('common.seeAll')}
                  onAction={() => actions.explore()}
                />
                <View style={[styles.grid, row]}>
                  {featured.slice(0, 6).map((business) => (
                    <View key={business.id} style={{ width: itemWidth, marginBottom: spacing.xl }}>
                      <BusinessTile
                        business={business}
                        variant="grid"
                        onPress={() => actions.openBusiness(business)}
                      />
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={styles.pro}>
              <ProBanner onPress={() => actions.joinPro(guest)} variant="dark" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      <CategorySheet
        slug={sheetSlug}
        name={sheetCategory ? data.categoryName(sheetCategory) : ''}
        businesses={sheetBusinesses}
        onClose={() => setSheetSlug(null)}
        onOpenBusiness={(b) => {
          setSheetSlug(null);
          actions.openBusiness(b);
        }}
        onSeeAll={() => {
          const slug = sheetSlug;
          setSheetSlug(null);
          if (slug) actions.explore({ category: slug });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brandTeal },
  safe: { flex: 1, backgroundColor: brandTeal },
  scroll: { backgroundColor: palette.white },
  hero: { width: '100%', backgroundColor: brandTeal },
  heroInner: { paddingTop: spacing.xs, paddingBottom: spacing.xl },
  header: { alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  locationBlock: { flex: 1, paddingEnd: spacing.md },
  locationName: { marginTop: 2 },
  bell: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 3,
    right: 2,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: '#F2542D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 10.5, lineHeight: 13, letterSpacing: 0 },
  // Wide elliptical arc (percentage radii) that overlaps the bubbles' lower edge.
  arc: {
    height: 84,
    marginTop: -56,
    backgroundColor: palette.white,
    borderTopLeftRadius: '50%',
    borderTopRightRadius: '50%',
    alignItems: 'center',
  },
  handle: {
    marginTop: 26,
    width: 54,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C9CDCC',
  },
  searchWrap: { marginTop: spacing.xl },
  categoryBlock: { marginTop: spacing.md },
  browseAll: { paddingVertical: spacing.xl },
  sheet: {
    backgroundColor: palette.white,
    marginTop: -1,
    paddingTop: spacing.xs,
  },
  pathSection: { marginTop: spacing.xs },
  pathsCompact: { gap: spacing.sm, marginTop: spacing.md },
  pathRow: { gap: spacing.md, marginTop: spacing.md, alignItems: 'stretch' },
  path: {
    flex: 1,
    minWidth: 0,
    minHeight: 142,
    padding: spacing.md,
    borderRadius: radius.card,
  },
  pathCompact: {
    minHeight: 72,
    padding: spacing.md,
    borderRadius: radius.card,
    alignItems: 'center',
    gap: spacing.md,
  },
  pathCompactBody: { flex: 1 },
  pathIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  pathDesc: { marginTop: 3, lineHeight: 17 },
  businessRail: { gap: spacing.lg, paddingBottom: spacing.xs, paddingEnd: spacing.xl },
  grid: { flexWrap: 'wrap', justifyContent: 'space-between' },
  pro: { marginTop: spacing.xxl },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
