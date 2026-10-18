import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';
import { SectionHeader } from '@/components/SectionHeader';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useLocale } from '@/hooks/useLocale';
import { palette, spacing } from '@/theme/tokens';
import {
  BusinessTile,
  CategoryRail,
  EmptyHome,
  HomeHeader,
  ProBanner,
  SearchField,
} from '@/features/home/components';
import { useHomeCopy } from '@/features/home/copy';
import { useBreakpoint, useContentMaxWidth, useGutter } from '@/features/home/layout';
import { useHomeActions } from '@/features/home/useHomeNav';
import type { HomeConceptProps } from '@/features/home/types';
import type { BusinessSummary } from '@/types';

/** De-duplicates businesses that belong to more than one mode. */
function mergeModes(list: BusinessSummary[][]): BusinessSummary[] {
  const seen = new Set<string>();
  const out: BusinessSummary[] = [];
  for (const group of list) {
    for (const b of group) {
      if (seen.has(b.id)) continue;
      seen.add(b.id);
      out.push(b);
    }
  }
  return out;
}

/**
 * Concept E — The Premium Local Marketplace.
 * White, restrained, regular: one hero, one search, one grid, two rails.
 */
export function ConceptE({ guest, data }: HomeConceptProps) {
  const { t, isRTL } = useLocale();
  const copy = useHomeCopy();
  const actions = useHomeActions();
  const space = useBottomSpace();
  const bp = useBreakpoint();
  const gutter = useGutter();
  const maxWidth = useContentMaxWidth();
  const [term, setTerm] = useState('');

  const cols = bp === 'compact' ? 1 : bp === 'medium' ? 2 : 3;
  const cellWidth = cols === 1 ? '100%' : cols === 2 ? '48.4%' : '31.6%';

  const discover = data.businesses.slice(0, 6);

  const shops = useMemo(
    () => mergeModes([data.byMode('ORDER'), data.byMode('SHOWCASE')]).slice(0, 6),
    [data],
  );
  const services = useMemo(
    () => mergeModes([data.byMode('APPOINTMENT'), data.byMode('QUOTE')]).slice(0, 6),
    [data],
  );

  const railWidth = bp === 'compact' ? 236 : 272;

  return (
    <View style={styles.flex}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: space.scroll }}
        >
          <View
            style={[
              { paddingHorizontal: gutter },
              maxWidth ? { maxWidth, width: '100%', alignSelf: 'center' } : null,
            ]}
          >
            <View style={{ paddingTop: spacing.sm }}>
              <HomeHeader guest={guest} />
            </View>

            {/* Hero */}
            <View style={{ marginTop: bp === 'compact' ? spacing.xxl : spacing.xxxl }}>
              <Text
                style={[
                  styles.headline,
                  { fontSize: bp === 'compact' ? 34 : 46, lineHeight: bp === 'compact' ? 40 : 54 },
                ]}
              >
                {copy.eHeadline}
              </Text>
              <Text variant="body" muted style={styles.support}>
                {copy.eSupport}
              </Text>
            </View>

            <View style={styles.searchWrap}>
              <SearchField
                value={term}
                onChangeText={setTerm}
                onSubmit={() => actions.search(term)}
                placeholder={t('home.searchPlaceholder')}
                size="lg"
              />
            </View>

            <View style={{ marginTop: spacing.lg, marginHorizontal: -gutter }}>
              <View style={{ paddingHorizontal: gutter }}>
                <CategoryRail
                  categories={data.categories}
                  categoryName={data.categoryName}
                  onSelect={(slug) => actions.explore(slug ? { category: slug } : {})}
                />
              </View>
            </View>

            <View style={[styles.divider, { marginTop: spacing.xl }]} />

            {data.businesses.length === 0 ? (
              <EmptyHome guest={guest} />
            ) : (
              <>
                {/* Discover */}
                <View style={{ marginTop: spacing.lg }}>
                  <SectionHeader
                    title={copy.eDiscover}
                    actionLabel={t('common.seeAll')}
                    onAction={() => actions.explore()}
                  />
                  <View style={[styles.grid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    {discover.map((b) => (
                      <View key={b.id} style={{ width: cellWidth, marginBottom: spacing.xl }}>
                        <BusinessTile
                          business={b}
                          variant="grid"
                          onPress={() => actions.openBusiness(b)}
                        />
                      </View>
                    ))}
                  </View>
                </View>

                {/* Shops rail */}
                {shops.length > 0 ? (
                  <View style={{ marginTop: spacing.lg }}>
                    <SectionHeader
                      title={copy.eShops}
                      actionLabel={t('common.seeAll')}
                      onAction={() => actions.explore({ mode: 'ORDER' })}
                    />
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginHorizontal: -gutter }}
                      contentContainerStyle={[styles.rail, { paddingHorizontal: gutter }]}
                    >
                      {shops.map((b) => (
                        <BusinessTile
                          key={b.id}
                          business={b}
                          variant="rail"
                          width={railWidth}
                          onPress={() => actions.openBusiness(b)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                ) : null}

                {/* Services rail */}
                {services.length > 0 ? (
                  <View style={{ marginTop: spacing.lg }}>
                    <SectionHeader
                      title={copy.eServices}
                      actionLabel={t('common.seeAll')}
                      onAction={() => actions.explore({ mode: 'APPOINTMENT' })}
                    />
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginHorizontal: -gutter }}
                      contentContainerStyle={[styles.rail, { paddingHorizontal: gutter }]}
                    >
                      {services.map((b) => (
                        <BusinessTile
                          key={b.id}
                          business={b}
                          variant="rail"
                          width={railWidth}
                          onPress={() => actions.openBusiness(b)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </>
            )}

            <View style={{ marginTop: spacing.xxl }}>
              <ProBanner onPress={() => actions.joinPro(guest)} variant="light" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.white },
  headline: {
    fontWeight: '800',
    letterSpacing: -0.8,
    color: palette.ink,
    maxWidth: 620,
  },
  support: { marginTop: spacing.md, maxWidth: 560, lineHeight: 24 },
  searchWrap: { marginTop: spacing.xl, maxWidth: 560 },
  divider: { height: 1, backgroundColor: palette.border },
  grid: {
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rail: { gap: spacing.lg, paddingBottom: spacing.xs },
});
