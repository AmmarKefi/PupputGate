import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { Chip } from '@/components/Chip';
import { AtelierCover } from './AtelierCover';
import { categoryIcon } from '@/lib/catalogIcons';
import { palette, radius, spacing } from '@/theme/tokens';
import type { Category } from '@/types';

/** Horizontal category filter. Selection is honoured by the caller. */
export function CategoryRail({
  categories,
  categoryName,
  selected,
  onSelect,
}: {
  categories: Category[];
  categoryName: (c: Category) => string;
  selected?: string | null;
  onSelect: (slug: string | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.rail}
    >
      {categories.map((c) => (
        <Chip
          key={c.id}
          label={categoryName(c)}
          icon={categoryIcon(c.slug)}
          selected={selected === c.slug}
          onPress={() => onSelect(selected === c.slug ? null : c.slug)}
        />
      ))}
    </ScrollView>
  );
}

/**
 * Large category tiles. Uses the same editorial covers as businesses so the
 * page has one visual language; a category is not depicted with stock photos.
 */
export function CategoryTiles({
  categories,
  categoryName,
  onSelect,
  columns = 2,
  limit = 6,
}: {
  categories: Category[];
  categoryName: (c: Category) => string;
  onSelect: (slug: string) => void;
  columns?: number;
  limit?: number;
}) {
  const shown = categories.slice(0, limit);
  return (
    <View style={styles.grid}>
      {shown.map((c) => (
        <Pressable
          key={c.id}
          onPress={() => onSelect(c.slug)}
          accessibilityRole="button"
          accessibilityLabel={categoryName(c)}
          style={({ pressed }) => [
            {
              width: columns >= 3 ? `${100 / columns - 2}%` : columns === 2 ? '47.5%' : '100%',
            },
            styles.tile,
            pressed && { opacity: 0.88 },
          ]}
        >
          <AtelierCover
            seed={c.slug}
            name={categoryName(c)}
            accent={palette.forest}
            icon={categoryIcon(c.slug)}
            ratio={1.7}
            showMonogram={false}
          />
          <Text variant="bodyStrong" numberOfLines={1} style={{ marginTop: spacing.sm }}>
            {categoryName(c)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: { gap: spacing.sm, paddingVertical: 4, paddingEnd: spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { marginBottom: spacing.lg, borderRadius: radius.input, overflow: 'hidden' },
});
