import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { Glass } from '@/components/Glass';
import { CategoryGlyph } from '@/features/home/components/CategoryGlyph';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { useLocale } from '@/hooks/useLocale';
import { brandTeal, modeAccent, palette, radius, spacing } from '@/theme/tokens';
import { haptics } from '@/lib/haptics';

type RoleChoice = 'CUSTOMER' | 'MERCHANT';

/** Decorative floating category marks (x/y are fractions of the hero area). */
const FLOATERS = [
  { slug: 'gastronomie', x: 0.08, y: 0.12, size: 74 },
  { slug: 'beaute', x: 0.62, y: 0.06, size: 92 },
  { slug: 'photographie', x: 0.82, y: 0.36, size: 62 },
  { slug: 'tourisme', x: 0.04, y: 0.5, size: 84 },
  { slug: 'depannage', x: 0.38, y: 0.62, size: 66 },
  { slug: 'artisanat', x: 0.7, y: 0.72, size: 78 },
];

function Floater({ slug, x, y, size, index, w, h }: (typeof FLOATERS)[number] & { index: number; w: number; h: number }) {
  const bob = useSharedValue(0);
  const enter = useSharedValue(0);
  useEffect(() => {
    enter.value = withDelay(120 + index * 90, withSpring(1, { damping: 12, stiffness: 120 }));
    bob.value = withDelay(
      index * 260,
      withRepeat(withTiming(1, { duration: 2800 + index * 350, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [bob, enter, index]);
  const style = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (bob.value - 0.5) * (index % 2 ? 14 : -14) }, { scale: 0.5 + enter.value * 0.5 }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x * w, top: y * h, width: size + 16, height: size + 16 }, style]}>
      <View style={styles.floatCircle}>
        <CategoryGlyph slug={slug} size={size * 0.72} />
      </View>
    </Animated.View>
  );
}

/**
 * Entry gateway. An account is required to use PupputGate, so this is the
 * first thing a signed-out user sees: brand, a short promise, and two clear
 * ways in (create an account, or sign in) on a frosted sheet.
 */
export default function Welcome() {
  const router = useRouter();
  const { t, isRTL } = useLocale();
  const space = useBottomSpace();
  const { width, height } = useWindowDimensions();
  const [role, setRole] = useState<RoleChoice>('CUSTOMER');

  // Room left between the headline and the sheet (~360dp tall) for the floating marks.
  const heroH = Math.max(190, Math.min(height - 360 - 200, 340));
  const row = { flexDirection: isRTL ? ('row-reverse' as const) : ('row' as const) };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        pointerEvents="none"
        colors={['#22C4B9', brandTeal, '#0E8A82']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={['top']} style={styles.top}>
        <View style={[styles.topRow, row]}>
          <Text variant="title" color={palette.white} style={styles.wordmark}>
            PupputGate
          </Text>
        </View>

        <Animated.View entering={FadeIn.duration(400)} style={styles.copy}>
          <Text variant="hero" color={palette.white} style={styles.title}>
            {t('welcome.tagline')}
          </Text>
        </Animated.View>

        <View style={{ height: heroH }}>
          {FLOATERS.map((f, i) => (
            <Floater key={f.slug} {...f} index={i} w={width - 90} h={heroH - 90} />
          ))}
        </View>
      </SafeAreaView>

      <Animated.View
        entering={FadeInDown.delay(150).duration(450)}
        style={[styles.sheetHost, { bottom: Math.max(space.system, spacing.sm) }]}
      >
        <Glass radius={34} intensity={90}>
          <View style={styles.sheetInner}>
            <Text variant="meta" muted style={{ marginBottom: spacing.sm }}>
              {t('welcome.chooseRole')}
            </Text>
            <View style={[styles.roles, row]}>
              {(
                [
                  { id: 'CUSTOMER', title: t('welcome.client'), hint: t('welcome.clientHint'), icon: 'person', accent: modeAccent.APPOINTMENT },
                  { id: 'MERCHANT', title: t('welcome.merchant'), hint: t('welcome.merchantHint'), icon: 'storefront', accent: modeAccent.ORDER },
                ] as const
              ).map((r) => {
                const on = role === r.id;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => {
                      haptics.tap();
                      setRole(r.id);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    style={[styles.role, on && { borderColor: r.accent, backgroundColor: `${r.accent}12` }]}
                  >
                    <View style={[styles.roleIcon, { backgroundColor: on ? r.accent : `${r.accent}1F` }]}>
                      <Ionicons name={r.icon} size={18} color={on ? palette.white : r.accent} />
                    </View>
                    <Text variant="bodyStrong" numberOfLines={2} style={{ marginTop: spacing.sm }}>
                      {r.title}
                    </Text>
                    <Text variant="meta" muted numberOfLines={1}>
                      {r.hint}
                    </Text>
                    {on ? (
                      <View style={[styles.check, { backgroundColor: r.accent }]}>
                        <Ionicons name="checkmark" size={12} color={palette.white} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <View style={{ height: spacing.lg }} />
            <Button
              label={t('welcome.createAccount')}
              onPress={() => router.push({ pathname: '/register', params: { role } })}
            />
            <Button
              label={t('welcome.haveAccount')}
              variant="ghost"
              onPress={() => router.push('/login')}
              style={{ marginTop: spacing.sm }}
            />
            <Text variant="meta" muted center style={styles.trust}>
              {t('welcome.trust')}
            </Text>
          </View>
        </Glass>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brandTeal },
  top: { paddingHorizontal: spacing.xl },
  topRow: { alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.sm },
  wordmark: { letterSpacing: -0.4, fontWeight: '800' },
  floatCircle: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#003F3A',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  copy: { marginTop: spacing.xl },
  title: { fontSize: 30, lineHeight: 36 },
  sheetHost: { position: 'absolute', left: spacing.sm, right: spacing.sm },
  sheetInner: { padding: spacing.xl },
  roles: { gap: spacing.md },
  role: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: 'rgba(0,79,72,0.1)',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  roleIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  check: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trust: { marginTop: spacing.md },
});
