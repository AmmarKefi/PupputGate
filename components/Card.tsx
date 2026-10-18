import React from 'react';
import { Pressable, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { palette, radius, spacing, elevation } from '@/theme/tokens';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  raised?: boolean;
  accessibilityLabel?: string;
}

export function Card({ children, onPress, style, padded = true, raised, accessibilityLabel }: Props) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const content = (
    <View style={[styles.card, padded && styles.padded, raised ? elevation.soft : styles.flat, style]}>
      {children}
    </View>
  );
  if (!onPress) return content;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.975, { damping: 18, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={anim}>{content}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.white, borderRadius: radius.card, overflow: 'hidden' },
  padded: { padding: spacing.lg },
  flat: { borderWidth: StyleSheet.hairlineWidth, borderColor: palette.border },
});
