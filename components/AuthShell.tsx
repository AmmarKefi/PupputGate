import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { Text } from './Text';
import { KeyboardScroll } from './KeyboardScroll';
import { brandTeal, palette, radius, spacing } from '@/theme/tokens';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useLocale } from '@/hooks/useLocale';
import { haptics } from '@/lib/haptics';

/**
 * Shared frame for sign-in and sign-up: a blue header with the PupputGate
 * wordmark and a big title, over a white form sheet. When the keyboard opens
 * the header tucks its subtitle away so the form always has room.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  onBack,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onBack?: () => void;
}) {
  const router = useRouter();
  const { isRTL } = useLocale();
  const space = useBottomSpace();
  const kb = useKeyboard();

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient pointerEvents="none" colors={[brandTeal, brandTeal, '#0F9A91']} style={StyleSheet.absoluteFill} />
      {/* soft decorative discs */}
      <View pointerEvents="none" style={[styles.disc, { top: -70, right: -50, width: 220, height: 220 }]} />
      <View pointerEvents="none" style={[styles.disc, { top: 90, left: -80, width: 160, height: 160, opacity: 0.6 }]} />

      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={[styles.topRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Pressable
            onPress={() => {
              haptics.tap();
              if (onBack) onBack();
              else router.back();
            }}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.back}
          >
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={22} color={palette.white} />
          </Pressable>
          <Text variant="section" color={palette.white} style={styles.wordmark}>
            PupputGate
          </Text>
          <View style={styles.back} />
        </View>

        <Animated.View layout={LinearTransition.duration(220)} style={styles.titleBlock}>
          <Animated.Text entering={FadeInDown.duration(380)} style={styles.title} numberOfLines={2}>
            {title}
          </Animated.Text>
          {subtitle && !kb.visible ? (
            <Animated.Text entering={FadeIn.delay(80).duration(300)} style={styles.subtitle}>
              {subtitle}
            </Animated.Text>
          ) : null}
        </Animated.View>
      </SafeAreaView>

      <Animated.View entering={FadeInDown.delay(60).duration(420)} layout={LinearTransition.duration(220)} style={styles.sheet}>
        <KeyboardScroll
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: spacing.xl,
            paddingTop: spacing.xl + 4,
            paddingBottom: Math.max(space.system, spacing.lg) + spacing.xl,
          }}
        >
          {children}
        </KeyboardScroll>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brandTeal },
  disc: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)' },
  header: { paddingHorizontal: spacing.xl },
  topRow: { alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.sm, height: 56 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)' },
  wordmark: { letterSpacing: 0.3, fontWeight: '800' },
  titleBlock: { paddingTop: spacing.lg, paddingBottom: spacing.xl + 8 },
  title: { color: palette.white, fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: 'rgba(255,255,255,0.88)', fontSize: 15.5, lineHeight: 22, marginTop: spacing.sm },
  sheet: {
    flex: 1,
    backgroundColor: palette.white,
    borderTopLeftRadius: radius.editorial + 6,
    borderTopRightRadius: radius.editorial + 6,
    overflow: 'hidden',
  },
});
