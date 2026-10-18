import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { modeAccent, palette } from '@/theme/tokens';
import type { CommerceMode } from '@/types';

/**
 * Branded placeholder cover (no random stock imagery): a mode-tinted surface
 * with the business monogram and its category icon. Resilient offline.
 */
export function CoverPlaceholder({
  name,
  mode,
  icon,
  height = 150,
}: {
  name: string;
  mode: CommerceMode;
  icon?: keyof typeof Ionicons.glyphMap;
  height?: number;
}) {
  const accent = modeAccent[mode];
  const monogram = name.trim().slice(0, 1).toUpperCase();
  return (
    <View style={[styles.wrap, { height, backgroundColor: `${accent}14` }]}>
      <View style={styles.pattern}>
        {icon ? <Ionicons name={icon} size={Math.min(height * 0.5, 72)} color={`${accent}33`} /> : null}
      </View>
      <View style={[styles.monoCircle, { backgroundColor: accent }]}>
        <Text variant="title" color={palette.white}>
          {monogram}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  pattern: { position: 'absolute', right: 10, bottom: 6, opacity: 0.9 },
  monoCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
});
