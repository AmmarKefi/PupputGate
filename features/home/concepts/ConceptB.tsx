import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { palette, radius, spacing } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useBreakpoint, useColumns, useContentMaxWidth, useGutter } from '../layout';
import { useHomeCopy } from '../copy';
import { useHomeActions } from '../useHomeNav';
import {
  BusinessTile,
  CategoryTiles,
  EmptyHome,
  HomeHeader,
  ProBanner,
  SearchField,
} from '../components';
import type { HomeConceptProps } from '../types';

/**
 * Concept B — "One Search, Every Local Need".
 *
 * The search experience owns the page: an oversized field, real suggested
 * searches, then categories and businesses answering it.
 */
export function ConceptB({ guest, data }: HomeConceptProps) {
  const { t, isRTL } = useLocale();
  const copy = useHomeCopy();
  const actions = useHomeActions();
  const space = useBottomSpace();
  const bp = useBreakpoint();
  const gutter = useGutter();
  const maxWidth = useContentMaxWidth();
  const columns = useColumns(1, 2, 3);
  const [term, setTerm] = useState('');

  const compact = bp === 'compact';
  const tileWidth = columns === 1 ? '100%' : columns === 2 ? '48%' : '31.5%';
  const featured = data.businesses.slice(0, 6);

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: space.scroll }}
      >
        <View
          style={[
            styles.content,
            {
              paddingHorizontal: gutter,
              maxWidth: maxWidth ?? undefined,
              alignSelf: maxWidth ? 'center' : 'stretch',
            },
          ]}
        >
          <View style={{ paddingTop: spacing.sm }}>
            <HomeHeader guest={guest} />
          </View>

          {/* Search-first hero */}
          <View style={[styles.hero, compact && styles.heroCompact]}>
            <Text
              variant="title"
              style={[
                styles.headline,
                compact ? styles.headlineCompact : styles.headlineWide,
                isRTL && { textAlign: 'right' },
              ]}
            >
              {copy.bHeadline}
            </Text>
            <Text variant="body" muted style={styles.support}>
              {copy.bSupport}
            </Text>

            <View style={styles.searchWrap}>
              <SearchField
                value={term}
                onChangeText={setTerm}
                onSubmit={() => actions.search(term)}
                placeholder={t('home.searchPlaceholder')}
                size="lg"
              />
            </View>

            <Text variant="eyebrow" color={palette.mutedText} style={{ marginTop: spacing.xl }}>
              {copy.bTry}
            </Text>
            <View style={[styles.promptRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {copy.bPrompts.map((prompt) => (
                <Pressable
                  key={prompt.label}
                  onPress={() => actions.explore(prompt.params)}
                  accessibilityRole="button"
                  accessibilityLabel={prompt.label}
                  style={({ pressed }) => [styles.prompt, pressed && { opacity: 0.82 }]}
                >
                  <Ionicons name="search-outline" size={13} color={palette.forest} />
                  <Text variant="meta" style={{ marginStart: 6 }}>
                    {prompt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Categories as the visual answer to the question */}
          <Text variant="section" style={{ marginTop: spacing.xxl, marginBottom: spacing.md }}>
            {copy.bCategories}
          </Text>
          <CategoryTiles
            categories={data.categories}
            categoryName={data.categoryName}
            onSelect={(slug) => actions.explore({ category: slug })}
            columns={compact ? 2 : 4}
            limit={8}
          />

          {/* Businesses */}
          <Text variant="section" style={{ marginTop: spacing.md, marginBottom: spacing.md }}>
            {copy.bDiscover}
          </Text>

          {featured.length === 0 ? (
            <EmptyHome guest={guest} />
          ) : (
            <View style={styles.grid}>
              {featured.map((b) => (
                <View key={b.id} style={[styles.cell, { width: tileWidth }]}>
                  <BusinessTile
                    business={b}
                    variant="grid"
                    onPress={() => actions.openBusiness(b)}
                  />
                </View>
              ))}
            </View>
          )}

          <Pressable
            onPress={() => actions.explore()}
            accessibilityRole="button"
            accessibilityLabel={t('common.seeAll')}
            style={styles.seeAll}
          >
            <Text variant="meta" color={palette.forest} style={{ fontWeight: '700' }}>
              {t('common.seeAll')}
            </Text>
            <Ionicons
              name={isRTL ? 'arrow-back' : 'arrow-forward'}
              size={14}
              color={palette.forest}
              style={{ marginStart: 4 }}
            />
          </Pressable>

          <View style={{ marginTop: spacing.xxl }}>
            <ProBanner onPress={() => actions.joinPro(guest)} variant="light" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.canvas },
  content: { width: '100%' },
  hero: { marginTop: spacing.xxl },
  heroCompact: { marginTop: spacing.xl },
  headline: { maxWidth: 620 },
  headlineCompact: { fontSize: 32, lineHeight: 38, letterSpacing: -0.6 },
  headlineWide: { fontSize: 46, lineHeight: 52, letterSpacing: -1.2 },
  support: { marginTop: spacing.md, maxWidth: 520 },
  searchWrap: { marginTop: spacing.xl, maxWidth: 620 },
  promptRow: { flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: palette.border,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  cell: { marginBottom: spacing.xl },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
  },
});
