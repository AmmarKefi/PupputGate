import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackHeader } from '@/components/BackHeader';
import { Text } from '@/components/Text';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { palette, spacing, radius, modeAccent } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import type { CommerceMode } from '@/types';
import type { TranslationKey } from '@/locales';

const MODES: { mode: CommerceMode; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'APPOINTMENT', icon: 'calendar-outline' },
  { mode: 'ORDER', icon: 'bag-handle-outline' },
  { mode: 'SHOWCASE', icon: 'diamond-outline' },
  { mode: 'QUOTE', icon: 'document-text-outline' },
];

const STEPS: {
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
}[] = [
  { icon: 'compass-outline', titleKey: 'howItWorks.step1Title', bodyKey: 'howItWorks.step1Body' },
  { icon: 'options-outline', titleKey: 'howItWorks.step2Title', bodyKey: 'howItWorks.step2Body' },
  { icon: 'checkmark-circle-outline', titleKey: 'howItWorks.step3Title', bodyKey: 'howItWorks.step3Body' },
];

export default function HowItWorks() {
  const { t, isRTL } = useLocale();
  const router = useRouter();
  const rowDirection = isRTL ? 'row-reverse' : 'row';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.canvas }} edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: spacing.lg }}>
        <BackHeader title={t('howItWorks.title')} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <Text variant="body" muted style={{ marginBottom: spacing.xl }}>
          {t('welcome.subtitle')}
        </Text>

        {/* Three steps */}
        {STEPS.map((s, i) => (
          <View key={s.titleKey} style={[styles.step, { flexDirection: rowDirection }]}>
            <View style={styles.stepRail}>
              <View style={styles.stepNumber}>
                <Text variant="bodyStrong" color={palette.white}>{i + 1}</Text>
              </View>
              {i < STEPS.length - 1 ? <View style={styles.stepLine} /> : null}
            </View>
            <View style={{ flex: 1, marginHorizontal: spacing.md, paddingBottom: spacing.lg }}>
              <View style={[styles.stepTitleRow, { flexDirection: rowDirection }]}>
                <Ionicons name={s.icon} size={18} color={palette.forest} />
                <Text variant="bodyStrong" style={{ marginHorizontal: spacing.sm }}>{t(s.titleKey)}</Text>
              </View>
              <Text variant="meta" muted style={{ marginTop: 4 }}>{t(s.bodyKey)}</Text>
            </View>
          </View>
        ))}

        {/* Modes */}
        <Text variant="section" style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>
          {t('howItWorks.modesTitle')}
        </Text>
        {MODES.map((m) => (
          <Card key={m.mode} style={styles.item}>
            <View style={[styles.row, { flexDirection: rowDirection }]}>
              <View style={[styles.icon, { backgroundColor: `${modeAccent[m.mode]}1A` }]}>
                <Ionicons name={m.icon} size={20} color={modeAccent[m.mode]} />
              </View>
              <View style={{ flex: 1, marginHorizontal: spacing.md }}>
                <Text variant="bodyStrong">{t(`mode.${m.mode}` as TranslationKey)}</Text>
                <Text variant="meta" muted style={{ marginTop: 2 }}>
                  {t(`modeDesc.${m.mode}` as TranslationKey)}
                </Text>
              </View>
            </View>
          </Card>
        ))}

        <Text variant="meta" muted center style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}>
          {t('welcome.trust')}
        </Text>
        <Button label={t('howItWorks.cta')} onPress={() => router.replace('/explore')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  step: { alignItems: 'stretch' },
  stepRail: { alignItems: 'center', width: 36 },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLine: { flex: 1, width: 2, backgroundColor: palette.border, marginVertical: 4 },
  stepTitleRow: { alignItems: 'center' },
  item: { marginBottom: spacing.sm },
  row: { alignItems: 'center' },
  icon: { width: 42, height: 42, borderRadius: radius.card - 6, alignItems: 'center', justifyContent: 'center' },
});
