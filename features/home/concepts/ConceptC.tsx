import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useLocale } from '@/hooks/useLocale';
import { formatDate } from '@/lib/format';
import { categoryIcon } from '@/lib/catalogIcons';
import { palette, spacing, modeAccent } from '@/theme/tokens';
import type { TranslationKey } from '@/locales';
import type { CommerceMode } from '@/types';
import {
  AtelierCover,
  BusinessTile,
  EmptyHome,
  HomeHeader,
  ProBanner,
  SearchField,
} from '@/features/home/components';
import { useContentMaxWidth, useGutter, useBreakpoint } from '@/features/home/layout';
import { useHomeCopy } from '@/features/home/copy';
import { useHomeActions } from '@/features/home/useHomeNav';
import type { HomeConceptProps } from '@/features/home/types';

const DAILY: CommerceMode[] = ['APPOINTMENT', 'ORDER', 'QUOTE'];

function SectionRule({ label }: { label: string }) {
  return (
    <View style={styles.sectionRule}>
      <Text variant="eyebrow" color={palette.terracotta}>
        {label}
      </Text>
      <View style={styles.rule} />
    </View>
  );
}

/**
 * Concept C — “The Hammamet Local Magazine”.
 * Typographic, asymmetric, rule-based: no cards, no imagery beyond the
 * editorial covers. Discovery reads like a city guide, but search and the
 * three transaction paths stay one tap away.
 */
export function ConceptC({ guest, data }: HomeConceptProps) {
  const copy = useHomeCopy();
  const { t, locale, isRTL } = useLocale();
  const actions = useHomeActions();
  const space = useBottomSpace();
  const breakpoint = useBreakpoint();
  const gutter = useGutter();
  const maxWidth = useContentMaxWidth();
  const [term, setTerm] = useState('');

  const compact = breakpoint === 'compact';
  const row = { flexDirection: isRTL ? 'row-reverse' : 'row' } as const;
  const featured = data.businesses[0];
  const rest = data.businesses.slice(1, 6);
  const shops = data.businesses.slice(0, 6);

  const featuredCategory = featured
    ? data.categories.find((c) => c.slug === featured.categorySlug)
    : undefined;
  const featuredLabel = featuredCategory
    ? data.categoryName(featuredCategory)
    : featured
      ? t(`mode.${featured.primaryMode}`)
      : '';

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.flex}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: space.scroll }}
        >
          <View
            style={[
              styles.page,
              { paddingHorizontal: gutter },
              maxWidth ? { maxWidth, width: '100%', alignSelf: 'center' } : null,
            ]}
          >
            <HomeHeader guest={guest} />

            {/* Masthead */}
            <View style={[styles.masthead, row]}>
              <Text variant="eyebrow" color={palette.ink}>
                {copy.cMasthead}
              </Text>
              <Text variant="eyebrow" muted>
                {formatDate(new Date().toISOString(), locale)}
              </Text>
            </View>
            <View style={styles.hairline} />

            {/* Editorial headline */}
            <View style={styles.heroBlock}>
              <Text
                variant="title"
                style={[
                  styles.headline,
                  { fontSize: compact ? 38 : 54, lineHeight: compact ? 42 : 58 },
                ]}
              >
                {copy.cHeadline}
              </Text>
              <Text variant="body" muted style={[styles.standfirst, { maxWidth: 520 }]}>
                {copy.cSupport}
              </Text>

              <View style={{ maxWidth: 520, marginTop: spacing.xl }}>
                <SearchField
                  value={term}
                  onChangeText={setTerm}
                  onSubmit={() => actions.search(term)}
                  placeholder={t('home.searchPlaceholder')}
                />
              </View>
            </View>

            {data.businesses.length === 0 ? (
              <EmptyHome guest={guest} />
            ) : (
              <>
                {/* Featured story */}
                {featured ? (
                  <View style={styles.storyBlock}>
                    <SectionRule label={copy.cStory} />
                    <Pressable
                      onPress={() => actions.openBusiness(featured)}
                      accessibilityRole="button"
                      accessibilityLabel={`${copy.cStory} — ${featured.name}`}
                      style={({ pressed }) => [
                        styles.story,
                        compact ? null : row,
                        pressed && { opacity: 0.94 },
                      ]}
                    >
                      <View style={compact ? null : styles.storyMedia}>
                        <AtelierCover
                          seed={featured.slug}
                          name={featured.name}
                          accent={modeAccent[featured.primaryMode]}
                          icon={categoryIcon(featured.categorySlug)}
                          ratio={compact ? 1.5 : 1.15}
                        />
                      </View>
                      <View
                        style={
                          compact
                            ? { marginTop: spacing.lg }
                            : { flex: 1, paddingStart: spacing.xxl, justifyContent: 'center' }
                        }
                      >
                        <Text variant="eyebrow" color={modeAccent[featured.primaryMode]}>
                          {featuredLabel}
                        </Text>
                        <Text
                          variant="title"
                          style={{ marginTop: spacing.sm, fontSize: compact ? 27 : 34, lineHeight: compact ? 33 : 40 }}
                        >
                          {featured.name}
                        </Text>
                        <Text variant="meta" muted style={{ marginTop: spacing.xs }}>
                          {featured.zoneName}
                        </Text>
                        {featured.shortDescription ? (
                          <Text variant="body" style={{ marginTop: spacing.md }}>
                            {featured.shortDescription}
                          </Text>
                        ) : null}
                        <View style={[styles.readRow, row]}>
                          <Text variant="meta" color={palette.forest} style={{ fontWeight: '700' }}>
                            {copy.cRead}
                          </Text>
                          <Ionicons
                            name={isRTL ? 'arrow-back' : 'arrow-forward'}
                            size={15}
                            color={palette.forest}
                            style={{ marginStart: 5 }}
                          />
                        </View>
                      </View>
                    </Pressable>
                  </View>
                ) : null}

                {/* Numbered address index */}
                {rest.length > 0 ? (
                  <View style={styles.section}>
                    <SectionRule label={copy.cAddresses} />
                    {rest.map((b, i) => (
                      <Pressable
                        key={b.id}
                        onPress={() => actions.openBusiness(b)}
                        accessibilityRole="button"
                        accessibilityLabel={`${b.name}, ${b.zoneName}`}
                        style={({ pressed }) => [
                          styles.numRow,
                          row,
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Text variant="eyebrow" muted style={styles.numIndex}>
                          {String(i + 2).padStart(2, '0')}
                        </Text>
                        <View style={styles.numBody}>
                          <Text variant="bodyStrong" numberOfLines={1}>
                            {b.name}
                          </Text>
                          <Text variant="meta" muted numberOfLines={1} style={{ marginTop: 1 }}>
                            {b.zoneName} · {t(`mode.${b.primaryMode}`)}
                          </Text>
                        </View>
                        <Ionicons
                          name={isRTL ? 'chevron-back' : 'chevron-forward'}
                          size={16}
                          color={palette.mutedText}
                        />
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                {/* Everyday services */}
                <View style={styles.section}>
                  <SectionRule label={copy.cDaily} />
                  <View style={compact ? undefined : [styles.dailyRow, row]}>
                    {DAILY.map((m) => (
                      <Pressable
                        key={m}
                        onPress={() => actions.explore({ mode: m })}
                        accessibilityRole="button"
                        accessibilityLabel={`${t(`mode.${m}`)} — ${t(`modeDesc.${m}` as TranslationKey)}`}
                        style={({ pressed }) => [
                          styles.dailyItem,
                          { borderTopColor: modeAccent[m] },
                          compact ? styles.dailyItemStacked : styles.dailyItemWide,
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <View style={[styles.dailyHead, row]}>
                          <Text variant="bodyStrong" color={modeAccent[m]}>
                            {t(`mode.${m}`)}
                          </Text>
                          <Ionicons
                            name={isRTL ? 'arrow-back' : 'arrow-forward'}
                            size={15}
                            color={modeAccent[m]}
                          />
                        </View>
                        <Text variant="meta" muted style={{ marginTop: spacing.xs, lineHeight: 19 }}>
                          {t(`modeDesc.${m}` as TranslationKey)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Shops rail */}
                {shops.length > 0 ? (
                  <View style={styles.section}>
                    <SectionRule label={copy.cShops} />
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.rail}
                    >
                      {shops.map((b) => (
                        <BusinessTile
                          key={b.id}
                          business={b}
                          variant="rail"
                          width={compact ? 240 : 280}
                          onPress={() => actions.openBusiness(b)}
                        />
                      ))}
                    </ScrollView>
                  </View>
                ) : null}
              </>
            )}

            <View style={{ marginTop: spacing.xxxl }}>
              <ProBanner onPress={() => actions.joinPro(guest)} variant="light" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.canvas },
  flex: { flex: 1 },
  page: { paddingTop: spacing.sm },
  masthead: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  hairline: {
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: palette.ink,
    opacity: 0.35,
    marginTop: spacing.sm,
  },
  heroBlock: { marginTop: spacing.xxl },
  headline: {
    fontWeight: '800',
    letterSpacing: -1.2,
    maxWidth: 640,
  },
  standfirst: { marginTop: spacing.md, lineHeight: 24 },
  sectionRule: { marginTop: spacing.xxxl, marginBottom: spacing.lg },
  rule: {
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: palette.border,
    marginTop: spacing.sm,
  },
  storyBlock: { marginBottom: spacing.sm },
  story: { alignItems: 'stretch' },
  storyMedia: { flex: 1 },
  readRow: { alignItems: 'center', marginTop: spacing.lg },
  section: { marginBottom: spacing.sm },
  numRow: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  numIndex: { width: 34 },
  numBody: { flex: 1, marginHorizontal: spacing.md },
  dailyRow: { gap: spacing.xxl, alignItems: 'flex-start' },
  dailyItem: { borderTopWidth: 2, paddingTop: spacing.md },
  dailyItemWide: { flex: 1 },
  dailyItemStacked: { marginBottom: spacing.xl },
  dailyHead: { alignItems: 'center', justifyContent: 'space-between' },
  rail: { gap: spacing.lg, paddingVertical: spacing.xs, paddingEnd: spacing.xl },
});
