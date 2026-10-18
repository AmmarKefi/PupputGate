import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Glass } from './Glass';
import { Text } from './Text';
import { palette, spacing } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import { haptics } from '@/lib/haptics';

export function BackHeader({ title, onBack, right }: { title?: string; onBack?: () => void; right?: React.ReactNode }) {
  const router = useRouter();
  const { isRTL } = useLocale();
  return (
    <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Pressable
        onPress={() => {
          haptics.tap();
          if (onBack) onBack();
          else router.back();
        }}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Glass radius={22} style={styles.btn} shadow={false} intensity={50}>
          <View style={styles.btnInner}>
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={palette.ink} />
          </View>
        </Glass>
      </Pressable>
      {title ? (
        <Text variant="bodyStrong" numberOfLines={1} style={styles.title}>
          {title}
        </Text>
      ) : (
        <View style={styles.title} />
      )}
      <View style={styles.slot}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', paddingVertical: spacing.sm, minHeight: 56 },
  btn: { width: 44, height: 44 },
  btnInner: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  slot: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center' },
});
