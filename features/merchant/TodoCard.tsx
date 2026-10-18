import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { StatusBadge } from '@/components/StatusBadge';
import { palette, radius, spacing, modeAccent } from '@/theme/tokens';
import { haptics } from '@/lib/haptics';
import type { Todo } from './todos';

const KIND_ACCENT = {
  appointment: modeAccent.APPOINTMENT,
  order: modeAccent.ORDER,
  request: modeAccent.QUOTE,
} as const;

/**
 * One thing the owner can act on. The coloured edge says what kind it is, the
 * status badge says where it stands, and the buttons are the single next step.
 */
export function TodoCard({ todo, busy, index = 0 }: { todo: Todo; busy: boolean; index?: number }) {
  const accent = KIND_ACCENT[todo.kind];
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 6) * 55).duration(320)}
      layout={LinearTransition.springify().damping(18)}
      style={styles.card}
    >
      <View style={[styles.edge, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          <View style={[styles.icon, { backgroundColor: `${accent}18` }]}>
            <Ionicons name={todo.icon} size={18} color={accent} />
          </View>
          <View style={{ flex: 1, paddingRight: spacing.xs }}>
            <Text variant="bodyStrong" numberOfLines={1}>
              {todo.title}
            </Text>
            <Text variant="meta" muted numberOfLines={2} style={{ marginTop: 2 }}>
              {todo.sub}
            </Text>
          </View>
          <StatusBadge status={todo.status as never} />
        </View>

        {todo.actions.length > 0 ? (
          <View style={styles.actions}>
            {todo.actions.map((a) => {
              const primary = a.tone === 'primary';
              const secondary = a.tone === 'secondary';
              return (
                <Pressable
                  key={a.label}
                  disabled={busy}
                  onPress={() => {
                    haptics.tap();
                    a.run();
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.btn,
                    primary && { backgroundColor: accent },
                    secondary && { backgroundColor: `${accent}1A` },
                    !primary && !secondary && styles.btnGhost,
                    pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                    busy && { opacity: 0.6 },
                  ]}
                >
                  {busy && primary ? (
                    <ActivityIndicator color={palette.white} size="small" />
                  ) : (
                    <Text variant="bodyStrong" color={primary ? palette.white : secondary ? accent : palette.ink}>
                      {a.label}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: palette.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    marginBottom: spacing.md + 2,
    marginHorizontal: 1,
    shadowColor: '#003F3A',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  edge: { width: 5 },
  body: { flex: 1, paddingVertical: spacing.lg, paddingHorizontal: spacing.lg + 4 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md + 2 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md + 2 },
  btn: { flex: 1, minHeight: 46, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  btnGhost: { borderWidth: 1.5, borderColor: palette.border, backgroundColor: palette.white },
});
