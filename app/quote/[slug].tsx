import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { GlassFooter } from '@/components/GlassFooter';
import { KeyboardScroll } from '@/components/KeyboardScroll';
import { Input } from '@/components/Input';
import { Chip } from '@/components/Chip';
import { BackHeader } from '@/components/BackHeader';
import { SuccessView } from '@/components/SuccessView';
import { LoadingState, ErrorState } from '@/components/states';
import { palette, radius, spacing, modeAccent } from '@/theme/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useQuery } from '@/hooks/useQuery';
import { api, ApiError } from '@/lib/api';
import { haptics } from '@/lib/haptics';
import { signInHref, withQuery } from '@/lib/returnTo';
import type { Zone } from '@/types';

const accent = modeAccent.QUOTE;

type QuoteDraft = {
  problemType: string;
  description: string;
  zoneSlug: string | null;
  address: string;
  timeWindow: string;
  urgent: boolean;
  photoUrl: string;
};

/** Restores the quote form from the `draft` URL param (JSON), so sign-in does not lose it. */
function parseDraft(raw: string | undefined): Partial<QuoteDraft> {
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Partial<QuoteDraft>) : {};
  } catch {
    return {};
  }
}

export default function QuoteFlow() {
  const router = useRouter();
  const { t } = useLocale();
  const { slug, draft: rawDraft } = useLocalSearchParams<{ slug: string; draft?: string }>();
  const { user } = useAuth();
  const draft = parseDraft(rawDraft);

  const business = useQuery(() => api.business(String(slug)), { deps: [slug] });
  const zones = useQuery(() => api.zones(), {});
  const b = business.data?.business;

  const [problemType, setProblemType] = useState(draft.problemType ?? '');
  const [description, setDescription] = useState(draft.description ?? '');
  const [zoneSlug, setZoneSlug] = useState<string | null>(draft.zoneSlug ?? null);
  const [address, setAddress] = useState(draft.address ?? '');
  const [timeWindow, setTimeWindow] = useState(draft.timeWindow ?? '');
  const [urgent, setUrgent] = useState(draft.urgent ?? false);
  const [photoUrl, setPhotoUrl] = useState(draft.photoUrl ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const effectiveZone = zoneSlug ?? b?.zoneSlug ?? null;

  async function submit() {
    if (!b) return;
    const e: Record<string, string> = {};
    if (problemType.trim().length < 2) e.problemType = t('error.generic');
    if (description.trim().length < 5) e.description = t('error.generic');
    if (photoUrl && !/^https:\/\//.test(photoUrl.trim())) e.photoUrl = t('quote.photosHint');
    setErrors(e);
    if (Object.keys(e).length) { haptics.warning(); return; }

    if (!user) {
      // Guest: keep the form, and return here after sign-in.
      const nextDraft: QuoteDraft = {
        problemType,
        description,
        zoneSlug: zoneSlug,
        address,
        timeWindow,
        urgent,
        photoUrl,
      };
      router.push(signInHref(withQuery(`/quote/${slug}`, { draft: JSON.stringify(nextDraft) })) as never);
      return;
    }

    setSubmitting(true);
    try {
      await api.createRequest({
        businessId: b.id,
        problemType: problemType.trim(),
        description: description.trim(),
        zoneSlug: effectiveZone ?? 'centre',
        address: address.trim() || undefined,
        timeWindow: timeWindow.trim() || undefined,
        urgent,
        photoUrls: photoUrl.trim() ? [photoUrl.trim()] : undefined,
      });
      haptics.success();
      setDone(true);
    } catch (err) {
      haptics.error();
      setErrors({ form: err instanceof ApiError && err.code === 'NETWORK' ? t('error.network') : t('error.generic') });
    } finally {
      setSubmitting(false);
    }
  }

  if (business.loading) return <SafeAreaView style={styles.flex}><LoadingState /></SafeAreaView>;
  if (business.error || !b) return <SafeAreaView style={styles.flex}><ErrorState error={business.error} onRetry={business.refetch} /></SafeAreaView>;

  if (done) {
    return (
      <SuccessView
        accent={accent}
        title={t('quote.success')}
        hint={t('quote.successHint')}
        rows={[
          ...(b ? [{ icon: 'storefront-outline' as const, label: b.name, value: b.zoneName }] : []),
          { icon: 'construct-outline', label: problemType.trim(), value: urgent ? t('quote.urgent') : '—' },
        ]}
        primaryLabel={t('booking.seeActivity')}
        onPrimary={() => router.replace('/activity')}
        secondaryLabel={t('common.close')}
        onSecondary={() => router.replace(`/business/${slug}`)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.headerPad}><BackHeader title={b.name} /></View>
      <View style={styles.flex}>
        <KeyboardScroll contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Input label={t('quote.problemType')} value={problemType} onChangeText={setProblemType} error={errors.problemType} placeholder={t('quote.problemPlaceholder')} />
          <Input label={t('quote.description')} value={description} onChangeText={setDescription} error={errors.description} placeholder={t('quote.descriptionPlaceholder')} multiline style={{ minHeight: 90 }} />

          <Text variant="meta" muted style={styles.label}>{t('quote.zone')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {(zones.data?.zones ?? []).map((z: Zone) => (
              <Chip key={z.id} label={z.name} accent={accent} selected={effectiveZone === z.slug} onPress={() => setZoneSlug(z.slug)} />
            ))}
          </ScrollView>

          <View style={{ height: spacing.md }} />
          <Input label={t('quote.address')} hint={t('quote.addressHint')} value={address} onChangeText={setAddress} icon="lock-closed-outline" placeholder="Rue, quartierâ€¦" />
          <Input label={t('quote.timeWindow')} value={timeWindow} onChangeText={setTimeWindow} placeholder="Ex. matin, aprÃ¨s-midiâ€¦" />

          <Pressable onPress={() => setUrgent((u) => !u)} style={[styles.urgentRow, urgent && { borderColor: accent, backgroundColor: `${accent}0D` }]} accessibilityRole="switch" accessibilityState={{ checked: urgent }}>
            <Ionicons name={urgent ? 'checkbox' : 'square-outline'} size={22} color={urgent ? accent : palette.mutedText} />
            <Text variant="body" style={{ marginHorizontal: spacing.sm }}>{t('quote.urgent')}</Text>
          </Pressable>

          <Input label={t('quote.photos')} hint={t('quote.photosHint')} value={photoUrl} onChangeText={setPhotoUrl} error={errors.photoUrl} autoCapitalize="none" keyboardType="url" placeholder="https://â€¦" />

          {errors.form ? <Text variant="meta" color={palette.errorRed}>{errors.form}</Text> : null}
        </KeyboardScroll>
        <GlassFooter inline>
          <Button label={t('quote.submit')} accent={accent} loading={submitting} onPress={submit} />
        </GlassFooter>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.canvas },
  headerPad: { paddingHorizontal: spacing.lg },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl ?? 48 },
  label: { marginBottom: spacing.sm },
  chipRow: { paddingVertical: spacing.xs },
  urgentRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: palette.border, borderRadius: radius.card, padding: spacing.md, marginBottom: spacing.lg, backgroundColor: palette.white },
  footer: { backgroundColor: palette.white, borderTopWidth: 1, borderTopColor: palette.border, padding: spacing.lg },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
});
