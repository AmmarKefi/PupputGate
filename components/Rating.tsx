import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { palette } from '@/theme/tokens';

export function Rating({ avg, count, size = 14 }: { avg: number | null; count: number; size?: number }) {
  if (avg == null || count === 0) return null;
  return (
    <View style={styles.row} accessibilityLabel={`${avg} / 5, ${count}`}>
      <Ionicons name="star" size={size} color={palette.sand} />
      <Text variant="meta" color={palette.ink} style={{ marginStart: 3 }}>
        {avg.toFixed(1)}
      </Text>
      <Text variant="meta" muted style={{ marginStart: 3 }}>
        ({count})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
