import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { palette, radius, spacing } from '@/theme/tokens';
import { haptics } from '@/lib/haptics';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: string;
}

export function Chip({ label, selected, onPress, icon, accent = palette.forest }: Props) {
  return (
    <Pressable
      onPress={() => {
        if (!selected) haptics.tap();
        onPress?.();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      style={({ pressed }) => [
        styles.chip,
        selected ? { backgroundColor: accent, borderColor: accent } : styles.unselected,
        pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
      ]}
    >
      <View style={styles.row}>
        {icon ? (
          <Ionicons
            name={icon}
            size={15}
            color={selected ? palette.white : palette.mutedText}
            style={{ marginEnd: 6 }}
          />
        ) : null}
        <Text variant="meta" color={selected ? palette.white : palette.ink} style={{ fontWeight: '600' }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginEnd: spacing.sm,
  },
  unselected: { backgroundColor: 'rgba(255,255,255,0.78)', borderColor: palette.border },
  row: { flexDirection: 'row', alignItems: 'center' },
});
