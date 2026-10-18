import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { palette, radius, spacing } from '@/theme/tokens';
import { haptics } from '@/lib/haptics';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  accent?: string;
  style?: ViewStyle;
  fullWidth?: boolean;
  haptic?: boolean;
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Lighten a #RRGGBB colour toward white for the gradient highlight. */
function lift(hex: string, amount = 0.14) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) + (255 - ((n >> shift) & 255)) * amount);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  icon,
  accent,
  style,
  fullWidth = true,
  haptic = true,
  accessibilityHint,
}: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const solid =
    variant === 'primary' ? (accent ?? palette.forest) : variant === 'danger' ? palette.errorRed : null;
  const bg = solid ? solid : variant === 'secondary' ? 'rgba(40,90,69,0.10)' : 'transparent';
  const fg = solid ? palette.white : variant === 'secondary' ? palette.deepGreen : (accent ?? palette.forest);

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={() => {
        if (isDisabled) return;
        if (haptic) haptics.tap();
        onPress?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 18, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 260 });
      }}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={[
        styles.base,
        { backgroundColor: bg, opacity: isDisabled ? 0.5 : 1, alignSelf: fullWidth ? 'stretch' : 'flex-start' },
        solid && styles.solidShadow,
        solid ? { shadowColor: solid } : null,
        variant === 'ghost' && styles.ghost,
        animStyle,
        style,
      ]}
    >
      {solid ? (
        <LinearGradient
          colors={[lift(solid, 0.16), solid]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.button }]}
        />
      ) : null}
      <View style={styles.inner}>
        {loading ? (
          <ActivityIndicator color={fg} />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={19} color={fg} style={{ marginEnd: 8 }} /> : null}
            <Text variant="bodyStrong" color={fg}>
              {label}
            </Text>
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: radius.button,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  solidShadow: {
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  ghost: { borderWidth: 1, borderColor: palette.border },
  inner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});
