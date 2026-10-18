import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useKeyboard } from '@/hooks/useKeyboard';
import { Text } from '@/components/Text';
import { Input } from '@/components/Input';
import { Chip } from '@/components/Chip';
import { BusinessCard } from '@/components/BusinessCard';
import { EmptyState, ErrorState, Skeleton } from '@/components/states';
import { palette, radius, spacing, modeAccent } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import { useDebounce } from '@/hooks/useDebounce';
import { useQuery } from '@/hooks/useQuery';
import { api } from '@/lib/api';
import type { CommerceMode, Category, Zone } from '@/types';
import type { TranslationKey } from '@/locales';

const MODES: (CommerceMode | 'ALL')[] = ['ALL', 'APPOINTMENT', 'ORDER', 'SHOWCASE', 'QUOTE'];

export default function Explore() {
  const router = useRouter();
  const { t, isRTL, locale } = useLocale();
  const space = useBottomSpace();
  const kb = useKeyboard();
  const params = useLocalSearchParams<{ mode?: string; category?: string; zone?: string; q?: string; focus?: string }>();

  const [q, setQ] = useState(params.q ?? '');
  const [mode, setMode] = useState<CommerceMode | 'ALL'>((params.mode as CommerceMode) ?? 'ALL');
  const [category, setCategory] = useState<string | null>(params.category ?? null);
  const [zone, setZone] = useState<string | null>(params.zone ?? null);
  const [availableNow, setAvailableNow] = useState(false);
  const [sort, setSort] = useState<'rating' | 'name'>('rating');

  const debouncedQ = useDebounce(q, 300);

  const categories = useQuery(() => api.categories(), {});
  const zones = useQuery(() => api.zones(), {});

  const listParams = useMemo(
    () => ({
      q: debouncedQ || undefined,
      mode: mode === 'ALL' ? undefined : mode,
      category: category ?? undefined,
      zone: zone ?? undefined,
      availableNow: availableNow || undefined,
      sort,
    }),
    [debouncedQ, mode, category, zone, availableNow, sort],
  );

  const list = useQuery(() => api.businesses(listParams), {
    deps: [debouncedQ, mode, category, zone, availableNow, sort],
  });

  const localeName = locale as 'fr' | 'en' | 'ar';
  const catName = (c: Category) => (localeName === 'ar' ? c.nameAr : localeName === 'en' ? c.nameEn : c.nameFr);

  async function toggleFav(id: string, isFav?: boolean) {
    try {
      if (isFav) await api.removeFavourite(id);
      else await api.addFavourite(id);
      list.refetch();
    } catch {
      /* ignore */
    }
  }

  const businesses = list.data?.businesses ?? [];

  return (
    <SafeAreaView edges={['top']} style={styles.flex}>
      <Animated.View entering={FadeInDown.duration(260)} style={styles.header}>
        <Text variant="title">{t('explore.title')}</Text>
        {/* New `focus` param (from the Home search) remounts the field with the keyboard open. */}
        <Input
          key={`search-${params.focus ?? ''}`}
          autoFocus={!!params.focus}
          value={q}
          onChangeText={setQ}
          placeholder={t('home.searchPlaceholder')}
          icon="search-outline"
          autoCapitalize="none"
          returnKeyType="search"
          style={{ marginBottom: 0 }}
        />
      </Animated.View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {MODES.map((m) => (
          <Chip
            key={m}
            label={m === 'ALL' ? t('mode.all') : t(`mode.${m}` as TranslationKey)}
            selected={mode === m}
            accent={m === 'ALL' ? palette.forest : modeAccent[m]}
            onPress={() => setMode(m)}
          />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} style={styles.filterScroll}>
        <Chip label={t('explore.availableNow')} icon="flash-outline" selected={availableNow} onPress={() => setAvailableNow((v) => !v)} />
        {(zones.data?.zones ?? []).map((z: Zone) => (
          <Chip key={z.id} label={z.name} icon="location-outline" selected={zone === z.slug} onPress={() => setZone(zone === z.slug ? null : z.slug)} />
        ))}
        {(categories.data?.categories ?? []).map((c: Category) => (
          <Chip key={c.id} label={catName(c)} selected={category === c.slug} onPress={() => setCategory(category === c.slug ? null : c.slug)} />
        ))}
      </ScrollView>

      <View style={[styles.sortBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text variant="meta" muted style={{ marginEnd: spacing.sm }}>
          {t('explore.sort')}
        </Text>
        <Chip label={t('explore.sortRating')} icon="star" selected={sort === 'rating'} onPress={() => setSort('rating')} />
        <Chip label={t('explore.sortName')} icon="text" selected={sort === 'name'} onPress={() => setSort('name')} />
      </View>

      <View style={[styles.resultsBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text variant="meta" muted>
          {t('explore.resultsCount', { count: businesses.length })}
        </Text>
        <Pressable
          onPress={() => router.push({ pathname: '/map', params: { mode: mode === 'ALL' ? '' : mode, category: category ?? '', zone: zone ?? '' } })}
          style={[styles.mapToggle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          <Ionicons name="map" size={15} color={palette.white} />
          <Text variant="meta" color={palette.white} style={{ marginHorizontal: 5, fontWeight: '700' }}>
            {t('explore.map')}
          </Text>
        </Pressable>
      </View>

      {/* Virtualised: only the first screenful mounts on entry, the rest as you scroll. */}
      <FlatList
        data={list.loading || list.error ? [] : businesses}
        keyExtractor={(b) => b.id}
        renderItem={({ item: b }) => (
          <BusinessCard
            business={b}
            onPress={() => router.push(`/business/${b.slug}`)}
            onToggleFavourite={() => toggleFav(b.id, b.isFavourite)}
          />
        )}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.list, { paddingBottom: kb.visible ? kb.height + spacing.xl : space.scroll }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          list.loading ? (
            <>
              <Skeleton height={220} />
              <Skeleton height={220} />
            </>
          ) : list.error ? (
            <ErrorState error={list.error} onRetry={list.refetch} />
          ) : (
            <EmptyState icon="search-outline" title={t('explore.noResults')} hint={t('explore.noResultsHint')} />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.canvas },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.md },
  sortBar: { paddingHorizontal: spacing.xl, alignItems: 'center', paddingTop: spacing.xs },
  filterScroll: { flexGrow: 0, flexShrink: 0 },
  filterRow: { paddingHorizontal: spacing.xl, paddingVertical: 5, alignItems: 'center' },
  resultsBar: { paddingHorizontal: spacing.xl, justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md },
  mapToggle: { alignItems: 'center', backgroundColor: palette.forest, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  list: { paddingHorizontal: spacing.xl },
});
