import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { palette, radius, spacing } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import { HOME_COPY } from '@/features/home/copy';
import { LayoutProvider } from '@/features/home/layout';
import { HomeConcept } from '@/features/home/HomeConcept';
import { CONCEPTS, type ConceptId } from '@/features/home/types';

/**
 * Internal design preview — not a customer screen.
 *
 * It is deliberately unreachable from the app UI and refuses to render outside
 * a development build (or when EXPO_PUBLIC_DESIGN_PREVIEW=1 is set for a QA
 * build). It renders the five concepts against the real API.
 */
const ENABLED = __DEV__ || process.env.EXPO_PUBLIC_DESIGN_PREVIEW === '1';

type Device = 'phone' | 'tablet' | 'desktop';

const DEVICE_WIDTH: Record<Device, number> = { phone: 390, tablet: 768, desktop: 1280 };
const DEVICE_LABEL: Record<Device, string> = { phone: 'Téléphone · 390', tablet: 'Tablette · 768', desktop: 'Bureau · 1280' };

export default function DesignPreview() {
  const router = useRouter();
  const { locale } = useLocale();
  const copy = HOME_COPY[locale] ?? HOME_COPY.fr;

  const [concept, setConcept] = useState<ConceptId>('D');
  const [device, setDevice] = useState<Device>('phone');

  // The frame keeps its true width even when it is wider than the screen: the
  // stage scrolls horizontally, so a 1280 layout is inspected at 1280 and not
  // silently reflowed to a phone.
  const frameWidth = DEVICE_WIDTH[device];
  const meta = CONCEPTS.find((c) => c.id === concept) ?? CONCEPTS[0];

  if (!ENABLED) {
    return (
      <SafeAreaView style={styles.denied}>
        <Text variant="section" center>
          Aperçu indisponible
        </Text>
        <Text variant="meta" muted center style={{ marginTop: spacing.sm }}>
          Cet outil de design n’est disponible qu’en développement.
        </Text>
        <Pressable onPress={() => router.replace('/')} style={{ marginTop: spacing.xl }}>
          <Text variant="bodyStrong" color={palette.forest}>
            Retour à l’accueil
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      {/* Control bar */}
      <View style={styles.bar}>
        <View style={styles.barTop}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Fermer l’aperçu"
            hitSlop={8}
            style={styles.close}
          >
            <Ionicons name="close" size={18} color={palette.ink} />
          </Pressable>
          <View style={{ flex: 1, marginHorizontal: spacing.md }}>
            <Text variant="bodyStrong">Aperçu des accueils</Text>
            <Text variant="meta" muted numberOfLines={1}>
              Données de l’API · environnement de développement
            </Text>
          </View>
          <Text variant="meta" color={palette.ink} style={{ fontWeight: '700' }}>
            {frameWidth} px
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {CONCEPTS.map((c) => {
            const active = c.id === concept;
            return (
              <Pressable
                key={c.id}
                onPress={() => setConcept(c.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`Concept ${c.id} — ${c.name}`}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text
                  variant="meta"
                  color={active ? palette.white : palette.ink}
                  style={{ fontWeight: '800' }}
                >
                  {c.id}
                </Text>
                <Text
                  variant="meta"
                  color={active ? palette.white : palette.mutedText}
                  style={{ marginStart: 6 }}
                  numberOfLines={1}
                >
                  {c.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.deviceRow}>
          {(Object.keys(DEVICE_WIDTH) as Device[]).map((d) => (
            <Pressable
              key={d}
              onPress={() => setDevice(d)}
              accessibilityRole="button"
              accessibilityState={{ selected: device === d }}
              style={[styles.device, device === d && styles.deviceActive]}
            >
              <Text
                variant="meta"
                color={device === d ? palette.forest : palette.mutedText}
                style={{ fontWeight: '600' }}
              >
                {DEVICE_LABEL[d]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text variant="meta" muted numberOfLines={2} style={styles.note}>
          {meta.tagline} — {meta.note} {device !== 'phone' ? '· Faites glisser horizontalement.' : ''}
        </Text>
      </View>

      {/* Device frame: the Real thing, at the simulated width */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={device !== 'phone'}
        style={styles.stage}
        contentContainerStyle={styles.stageContent}
      >
        <View style={[styles.frame, { width: frameWidth }]}>
          <LayoutProvider width={frameWidth}>
            <HomeConcept concept={concept} guest />
          </LayoutProvider>
        </View>
      </ScrollView>

      <Text variant="meta" muted center style={styles.footer}>
        {copy.langLabel} · {locale.toUpperCase()} — écran interne, non exposé aux clients
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surfaceAlt },
  denied: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  bar: {
    backgroundColor: palette.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderBottomColor: palette.border,
  },
  barTop: { flexDirection: 'row', alignItems: 'center' },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipRow: { gap: spacing.xs, paddingVertical: spacing.sm, paddingEnd: spacing.lg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: palette.border,
    backgroundColor: palette.canvas,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: palette.forest, borderColor: palette.forest },
  deviceRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  device: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: radius.input,
    backgroundColor: palette.canvas,
  },
  deviceActive: { backgroundColor: palette.mint },
  note: { marginTop: spacing.sm, lineHeight: 17 },
  stage: { flex: 1 },
  stageContent: { padding: spacing.md, flexGrow: 1 },
  frame: {
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: palette.canvas,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: palette.border,
  },
  footer: { paddingVertical: spacing.xs, fontSize: 11 },
});
