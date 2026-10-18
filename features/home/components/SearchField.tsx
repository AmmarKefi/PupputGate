import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette, radius, spacing, type } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';

/**
 * Real search field: submitting navigates to /explore with the query, which is
 * the app's working search screen (server-side matching).
 */
export function SearchField({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  tone = 'light',
  size = 'md',
  autoFocus = false,
  onFilter,
  shape = 'pill',
}: {
  /** 'card' = rounded rectangle with a bare filter glyph (reference home). */
  shape?: 'pill' | 'card';
  value: string;
  onChangeText: (v: string) => void;
  onSubmit: () => void;
  placeholder: string;
  tone?: 'light' | 'dark';
  size?: 'md' | 'lg';
  autoFocus?: boolean;
  /** Optional functional filter entry point (e.g. open Explore with filters). */
  onFilter?: () => void;
}) {
  const { t, isRTL } = useLocale();
  const dark = tone === 'dark';
  const big = size === 'lg';
  const card = shape === 'card';

  return (
    <View
      style={[
        styles.field,
        big && styles.fieldLg,
        dark ? styles.dark : styles.light,
        card && styles.card,
        { flexDirection: isRTL ? 'row-reverse' : 'row' },
      ]}
    >
      <Ionicons name="search" size={big ? 22 : 18} color={dark ? palette.sand : card ? '#F2771A' : palette.terracotta} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={dark ? 'rgba(255,255,255,0.6)' : palette.mutedText}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        autoFocus={autoFocus}
        onSubmitEditing={onSubmit}
        accessibilityLabel={placeholder}
        style={[
          styles.input,
          big && { fontSize: 17 },
          { color: dark ? palette.white : palette.ink, textAlign: isRTL ? 'right' : 'left' },
        ]}
      />
      <Pressable
        onPress={onFilter ?? onSubmit}
        accessibilityRole="button"
        accessibilityLabel={onFilter ? t('explore.filters') : t('common.search')}
        style={[
          styles.go,
          big && styles.goLg,
          card
            ? { backgroundColor: 'transparent' }
            : { backgroundColor: onFilter ? palette.ink : dark ? palette.sand : palette.forest },
        ]}
      >
        {card ? (
          <View style={styles.bars}>
            <View style={[styles.bar, { width: 24 }]} />
            <View style={[styles.bar, { width: 17 }]} />
            <View style={[styles.bar, { width: 10 }]} />
          </View>
        ) : (
          <Ionicons
            name={onFilter ? 'options-outline' : isRTL ? 'arrow-back' : 'arrow-forward'}
            size={big ? 22 : 17}
            color={onFilter ? palette.white : dark ? palette.deepGreen : palette.white}
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    alignItems: 'center',
    borderRadius: radius.pill,
    paddingStart: spacing.lg,
    paddingEnd: 6,
    paddingVertical: 6,
    minHeight: 52,
    gap: spacing.sm,
  },
  fieldLg: { minHeight: 62, paddingStart: spacing.xl },
  light: {
    backgroundColor: palette.white,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: palette.border,
  },
  dark: { backgroundColor: 'rgba(255,255,255,0.12)' },
  bars: { alignItems: 'center', gap: 4 },
  bar: { height: 2.6, borderRadius: 2, backgroundColor: palette.ink },
  card: {
    borderRadius: 16,
    borderWidth: 0,
    shadowColor: '#003F3A',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: type.body.fontSize,
    paddingVertical: 8,
  },
  go: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  goLg: { width: 50, height: 50, borderRadius: 25 },
});
