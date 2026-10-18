import React from 'react';
import { View, type ViewStyle, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { Glass } from './Glass';
import { KeyboardScroll } from './KeyboardScroll';
import { palette, spacing } from '@/theme/tokens';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useKeyboard } from '@/hooks/useKeyboard';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: Edge[];
  background?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  footer?: React.ReactNode;
}

/**
 * Safe-area-aware screen container. Reserves space for the system navigation
 * bar and (inside tabs) the floating glass tab bar; footers float on glass and
 * rise above the keyboard; inputs scroll into view.
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ['top'],
  background = palette.canvas,
  refreshing,
  onRefresh,
  contentStyle,
  footer,
}: Props) {
  const space = useBottomSpace();
  const kb = useKeyboard();
  const inner = (
    <View style={[padded && styles.padded, { flexGrow: 1 }, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: background }]} edges={edges}>
      {scroll ? (
        <KeyboardScroll
          style={styles.flex}
          contentContainerStyle={{ paddingBottom: footer ? spacing.xl : kb.visible ? spacing.xl : space.scroll }}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="never"
          refreshControl={
            onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={palette.forest} /> : undefined
          }
        >
          {inner}
        </KeyboardScroll>
      ) : (
        <View style={[styles.flex, { paddingBottom: footer ? 0 : space.tabbed ? space.scroll - spacing.xl : 0 }]}>{inner}</View>
      )}
      {footer ? (
        <Glass radius={28} style={[styles.footerHost, { marginBottom: spacing.xs + (kb.visible ? kb.height : 0) }]} intensity={80}>
          <View style={[styles.footer, { paddingBottom: Math.max(space.system, spacing.md) }]}>{footer}</View>
        </Glass>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { paddingHorizontal: spacing.xl },
  footerHost: {
    marginHorizontal: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
});
