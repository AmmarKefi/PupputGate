import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Glass } from './Glass';
import { spacing } from '@/theme/tokens';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useKeyboard } from '@/hooks/useKeyboard';

/**
 * Floating action bar on Liquid Glass. It rests above the system navigation
 * bar and rises above the keyboard while you type.
 */
export function GlassFooter({ children, inline }: { children: React.ReactNode; inline?: boolean }) {
  const { system } = useBottomSpace();
  const kb = useKeyboard();
  // With the keyboard up there is no nav bar underneath: sit just above the keys.
  const bottom = kb.visible ? kb.height + spacing.sm : Math.max(system, spacing.sm);
  return (
    <View
      pointerEvents="box-none"
      style={inline ? { marginHorizontal: spacing.sm, marginBottom: bottom } : [styles.host, { bottom }]}
    >
      <Glass radius={30} intensity={80}>
        <View style={styles.inner}>{children}</View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: spacing.sm, right: spacing.sm },
  inner: { padding: spacing.md },
});
