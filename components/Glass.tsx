import React from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { glass, elevation } from '@/theme/tokens';

interface Props {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  /** Visual weight: 'regular' frosted white, 'clear' lighter, 'dark' tinted forest. */
  tone?: 'regular' | 'clear' | 'dark';
  intensity?: number;
  interactive?: boolean;
  shadow?: boolean;
  /** Android only: ref of a BlurTargetView to blur for real. */
  blurTarget?: React.RefObject<View | null>;
}

let liquid = false;
try {
  liquid = Platform.OS === 'ios' && isLiquidGlassAvailable();
} catch {
  liquid = false;
}

/**
 * Liquid Glass surface.
 *  - iOS 26+: native UIGlassEffect via expo-glass-effect.
 *  - Older iOS: system blur material.
 *  - Android: real blur when a blur target is provided, otherwise a frosted
 *    translucent fill with a specular top highlight and hairline rim.
 * Content is rendered above the material so text stays crisp.
 */
export function Glass({
  children,
  style,
  radius = 24,
  tone = 'regular',
  intensity = 60,
  interactive,
  shadow = true,
  blurTarget,
}: Props) {
  const flat = StyleSheet.flatten(style) ?? {};
  const outer: ViewStyle = { borderRadius: radius, ...(shadow ? elevation.soft : null) };

  if (liquid) {
    return (
      <View style={[outer, flat]}>
        <GlassView
          glassEffectStyle={tone === 'clear' ? 'clear' : 'regular'}
          tintColor={tone === 'dark' ? glass.fillDark : undefined}
          isInteractive={interactive}
          style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
        />
        <View style={{ borderRadius: radius, overflow: 'hidden' }}>{children}</View>
      </View>
    );
  }

  const fill =
    tone === 'dark' ? glass.fillDark : tone === 'clear' ? 'rgba(255,255,255,0.5)' : glass.fill;
  const tint = tone === 'dark' ? 'dark' : 'light';

  return (
    <View style={[outer, flat]}>
      <View style={[StyleSheet.absoluteFill, styles.clip, { borderRadius: radius }]}>
        <BlurView
          intensity={intensity}
          tint={tint}
          blurTarget={blurTarget}
          blurMethod={Platform.OS === 'android' && blurTarget ? 'dimezisBlurView' : 'none'}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} />
        <LinearGradient
          colors={[tone === 'dark' ? 'rgba(255,255,255,0.18)' : glass.highlight, 'rgba(255,255,255,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.6 }}
          style={[StyleSheet.absoluteFill, { opacity: 0.55 }]}
        />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radius,
              borderWidth: StyleSheet.hairlineWidth * 1.5,
              borderColor: tone === 'dark' ? 'rgba(255,255,255,0.22)' : glass.stroke,
            },
          ]}
        />
      </View>
      <View style={{ borderRadius: radius, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
});
