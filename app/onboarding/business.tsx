import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { GlassFooter } from '@/components/GlassFooter';
import { KeyboardScroll } from '@/components/KeyboardScroll';
import { Input } from '@/components/Input';
import { Chip } from '@/components/Chip';
import { Card } from '@/components/Card';
import { BackHeader } from '@/components/BackHeader';
import { CoverPlaceholder } from '@/components/CoverPlaceholder';
import { LoadingState } from '@/components/states';
import { palette, spacing, modeAccent } from '@/theme/tokens';
import { useLocale } from '@/hooks/useLocale';
import { useQuery } from '@/hooks/useQuery';
import { api, ApiError } from '@/lib/api';
import { categoryIcon } from '@/lib/catalogIcons';
import { categoryPhoto } from '@/lib/categoryPhotos';
import { haptics } from '@/lib/haptics';
import { pickImage, uploadCoverImage, type PickedImage } from '@/lib/upload';
import type { Category, Zone, CommerceMode } from '@/types';
import type { TranslationKey } from '@/locales';

const MODES: CommerceMode[] = ['APPOINTMENT', 'ORDER', 'SHOWCASE', 'QUOTE'];

type StepKey = 'intro' | 'identity' | 'category' | 'banner' | 'zone' | 'capacity' | 'review';

const STEP_TITLES: Record<StepKey, string> = {
  intro: 'onboard.step0',
  identity: 'onboard.step1',
  category: 'onboard.step2',
  banner: 'onboard.stepBanner',
  zone: 'onboard.step3',
  capacity: 'onboard.step4',
  review: 'onboard.step5',
};

const CHECKLIST: { key: TranslationKey; done: boolean }[] = [
  { key: 'onboard.checkProfile', done: true },
  { key: 'onboard.checkOffer', done: false },
  { key: 'onboard.checkAvailability', done: false },
  { key: 'onboard.checkPreview', done: false },
  { key: 'onboard.checkManage', done: false },
];

const BENEFITS: { icon: 'eye-outline' | 'albums-outline' | 'time-outline'; title: TranslationKey; body: TranslationKey }[] = [
  { icon: 'eye-outline', title: 'onboard.benefitVisibilityTitle', body: 'onboard.benefitVisibilityBody' },
  { icon: 'albums-outline', title: 'onboard.benefitOrganisationTitle', body: 'onboard.benefitOrganisationBody' },
  { icon: 'time-outline', title: 'onboard.benefitTimeTitle', body: 'onboard.benefitTimeBody' },
];

export default function Onboarding() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const loc = locale as 'fr' | 'en' | 'ar';

  const categories = useQuery(() => api.categories(), {});
  const zones = useQuery(() => api.zones(), {});

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [modes, setModes] = useState<CommerceMode[]>([]);
  const [primaryMode, setPrimaryMode] = useState<CommerceMode | null>(null);
  // Banner selection state (defaults to category bundled photo)
  const [pickedCover, setPickedCover] = useState<PickedImage | null>(null);
  const [coverUrl, setCoverUrl] = useState('');
  const [bannerMode, setBannerMode] = useState<'default' | 'picked' | 'url'>('default');
  const [bannerUrlInput, setBannerUrlInput] = useState('');
  const [showUrlForm, setShowUrlForm] = useState(false);

  const [zoneSlug, setZoneSlug] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [hideExactLocation, setHideExactLocation] = useState(false);
  const [capacity, setCapacity] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Steps adapt to the business model: capacity only matters for appointments.
  const steps: StepKey[] = [
    'intro',
    'identity',
    'category',
    'banner',
    'zone',
    ...(modes.includes('APPOINTMENT') ? (['capacity'] as StepKey[]) : []),
    'review',
  ];
  const current = steps[step];
  const isLast = step === steps.length - 1;

  function toggleMode(m: CommerceMode) {
    setModes((cur) => {
      const next = cur.includes(m) ? cur.filter((x) => x !== m) : [...cur, m];
      if (!next.includes(primaryMode as CommerceMode)) setPrimaryMode(next[0] ?? null);
      return next;
    });
  }

  const canNext = (() => {
    if (current === 'identity') return name.trim().length >= 2;
    if (current === 'category') return !!categorySlug && modes.length > 0 && !!primaryMode;
    if (current === 'zone') return !!zoneSlug;
    return true;
  })();

  async function submit() {
    setSubmitting(true);
    setErr(null);
    try {
      const res = await api.post<{ businessId: string }>('/merchant/onboarding', {
        name: name.trim(),
        shortDescription: shortDescription.trim() || undefined,
        phone: phone.trim() || undefined,
        categorySlug,
        modes,
        primaryMode,
        zoneSlug,
        address: address.trim() || undefined,
        hideExactLocation,
        capacityPerSlot: modes.includes('APPOINTMENT') ? parseInt(capacity, 10) || 1 : 1,
        coverImage: bannerMode === 'url' && coverUrl ? coverUrl : undefined,
      });

      if (bannerMode === 'picked' && pickedCover && res?.businessId) {
        try {
          await uploadCoverImage(res.businessId, pickedCover);
        } catch {
          /* Fallback gracefully to default banner */
        }
      }

      haptics.success();
      setDone(true);
    } catch (e) {
      haptics.error();
      setErr(e instanceof ApiError && e.code === 'NETWORK' ? t('error.network') : t('error.generic'));
    } finally {
      setSubmitting(false);
    }
  }

  if (categories.loading || zones.loading) return <SafeAreaView style={styles.flex}><LoadingState /></SafeAreaView>;

  if (done) {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.successWrap} showsVerticalScrollIndicator={false}>
          <View style={styles.successIcon}><Ionicons name="checkmark-circle" size={54} color={palette.forest} /></View>
          <Text variant="title" center style={{ marginTop: spacing.lg }}>{t('onboard.success')}</Text>
          <Text variant="body" muted center style={{ marginTop: spacing.sm }}>{t('onboard.successHint')}</Text>

          <Card style={styles.checklist}>
            <Text variant="bodyStrong" style={{ marginBottom: spacing.md }}>{t('onboard.checklistTitle')}</Text>
            {CHECKLIST.map((item) => (
              <View key={item.key} style={styles.checkRow}>
                <Ionicons
                  name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20}
                  color={item.done ? palette.forest : palette.border}
                />
                <Text variant="body" style={{ marginStart: spacing.sm, flex: 1 }}>{t(item.key)}</Text>
              </View>
            ))}
          </Card>

          <View style={styles.successAction}>
            <Button label={t('tabs.dashboard')} onPress={() => router.replace('/activity')} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const catName = (c: Category) => (loc === 'ar' ? c.nameAr : loc === 'en' ? c.nameEn : c.nameFr);
  const selectedCategory = (categories.data?.categories ?? []).find((c) => c.slug === categorySlug);
  const selectedZone = (zones.data?.zones ?? []).find((z: Zone) => z.slug === zoneSlug);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.headerPad}><BackHeader title={t('onboard.title')} onBack={() => (step > 0 ? setStep(step - 1) : router.back())} /></View>

      {/* Progress */}
      <View style={styles.progress}>
        {steps.map((_, i) => (
          <View key={i} style={[styles.progressDot, i <= step && { backgroundColor: palette.forest, flex: 1.4 }]} />
        ))}
      </View>
      <Text variant="meta" muted style={styles.stepLabel}>
        {step + 1}/{steps.length} · {current === 'banner' ? 'Bannière' : t(STEP_TITLES[current] as never)}
      </Text>

      <View style={styles.flex}>
        <KeyboardScroll contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {current === 'intro' ? (
            <>
              <Text variant="title">{t('onboard.introTitle')}</Text>
              <Text variant="body" muted style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>{t('onboard.introBody')}</Text>
              {BENEFITS.map((b) => (
                <Card key={b.title} style={{ marginBottom: spacing.md }}>
                  <View style={styles.benefitRow}>
                    <Ionicons name={b.icon} size={24} color={palette.forest} />
                    <View style={{ flex: 1, marginStart: spacing.md }}>
                      <Text variant="bodyStrong">{t(b.title)}</Text>
                      <Text variant="meta" muted style={{ marginTop: 2 }}>{t(b.body)}</Text>
                    </View>
                  </View>
                </Card>
              ))}
            </>
          ) : null}

          {current === 'identity' ? (
            <>
              <Input label={t('onboard.name')} value={name} onChangeText={setName} placeholder="Ex. Atelier Barber" />
              <Input label={t('onboard.shortDesc')} value={shortDescription} onChangeText={setShortDescription} multiline />
              <Input label={t('auth.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </>
          ) : null}

          {current === 'category' ? (
            <>
              <Text variant="meta" muted style={styles.label}>{t('onboard.category')}</Text>
              <View style={styles.wrap}>
                {(categories.data?.categories ?? []).map((c) => (
                  <Chip key={c.id} label={catName(c)} selected={categorySlug === c.slug} onPress={() => setCategorySlug(c.slug)} />
                ))}
              </View>
              <Text variant="meta" muted style={[styles.label, { marginTop: spacing.lg }]}>{t('onboard.modes')}</Text>
              <View style={styles.wrap}>
                {MODES.map((m) => (
                  <Chip key={m} label={t(`mode.${m}` as TranslationKey)} accent={modeAccent[m]} selected={modes.includes(m)} onPress={() => toggleMode(m)} />
                ))}
              </View>
              {modes.length > 0 ? (
                <>
                  <Text variant="meta" muted style={[styles.label, { marginTop: spacing.lg }]}>{t('onboard.primaryMode')}</Text>
                  <View style={styles.wrap}>
                    {modes.map((m) => (
                      <Chip key={m} label={t(`mode.${m}` as TranslationKey)} accent={modeAccent[m]} selected={primaryMode === m} onPress={() => setPrimaryMode(m)} />
                    ))}
                  </View>
                </>
              ) : null}
            </>
          ) : null}

          {current === 'banner' ? (
            <>
              <Text variant="title">Bannière de votre commerce</Text>
              <Text variant="body" muted style={{ marginTop: spacing.sm, marginBottom: spacing.lg }}>
                Une photo de vitrine met en valeur votre établissement. Vous pouvez choisir une photo personnalisée ou utiliser notre bannière soignée par défaut.
              </Text>

              <Card padded={false} style={{ overflow: 'hidden', marginBottom: spacing.lg, borderRadius: 20 }}>
                <View style={{ width: '100%', height: 180, position: 'relative' }}>
                  {bannerMode === 'picked' && pickedCover ? (
                    <Image source={{ uri: pickedCover.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : bannerMode === 'url' && coverUrl ? (
                    <Image source={{ uri: coverUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : categoryPhoto(categorySlug) ? (
                    <Image source={categoryPhoto(categorySlug)!} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <CoverPlaceholder name={name || 'Mon commerce'} mode={primaryMode ?? 'SHOWCASE'} icon={categoryIcon(categorySlug ?? '')} height={180} />
                  )}

                  <View style={{ position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 }}>
                    <Text variant="eyebrow" color={palette.white} style={{ fontWeight: '800' }}>
                      {bannerMode === 'default' ? 'Bannière par défaut assignée' : 'Bannière personnalisée active'}
                    </Text>
                  </View>
                </View>

                <View style={{ padding: spacing.md, gap: spacing.sm }}>
                  {!showUrlForm ? (
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <Button
                        label="Choisir une photo"
                        icon="image-outline"
                        onPress={async () => {
                          const img = await pickImage([16, 9]);
                          if (img) {
                            setPickedCover(img);
                            setBannerMode('picked');
                          }
                        }}
                        style={{ flex: 1 }}
                      />
                      <Button
                        label="Par lien URL"
                        variant="secondary"
                        icon="link-outline"
                        onPress={() => setShowUrlForm(true)}
                        style={{ flex: 0.9 }}
                      />
                    </View>
                  ) : (
                    <View style={{ gap: spacing.sm }}>
                      <Input
                        label="Lien web de l'image (HTTPS)"
                        placeholder="https://..."
                        value={bannerUrlInput}
                        onChangeText={setBannerUrlInput}
                        keyboardType="url"
                      />
                      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                        <Button
                          label="Valider l'image"
                          onPress={() => {
                            const trimmed = bannerUrlInput.trim();
                            if (/^https?:\/\//i.test(trimmed)) {
                              setCoverUrl(trimmed);
                              setBannerMode('url');
                              setShowUrlForm(false);
                            }
                          }}
                          style={{ flex: 1 }}
                        />
                        <Button
                          label="Annuler"
                          variant="ghost"
                          onPress={() => setShowUrlForm(false)}
                          style={{ flex: 0.6 }}
                        />
                      </View>
                    </View>
                  )}

                  {bannerMode !== 'default' ? (
                    <Button
                      label="Rétablir la bannière par défaut"
                      variant="ghost"
                      onPress={() => {
                        setBannerMode('default');
                        setPickedCover(null);
                        setCoverUrl('');
                        setBannerUrlInput('');
                      }}
                      style={{ marginTop: spacing.xs }}
                    />
                  ) : null}

                  <Text variant="meta" muted style={{ marginTop: 4 }}>
                    💡 Si vous ne personnalisez pas l'image, la photo par défaut ci-dessus sera attribuée. Vous pourrez la changer à tout moment depuis votre boutique.
                  </Text>
                </View>
              </Card>
            </>
          ) : null}

          {current === 'zone' ? (
            <>
              <Text variant="meta" muted style={styles.label}>{t('onboard.zone')}</Text>
              <View style={styles.wrap}>
                {(zones.data?.zones ?? []).map((z: Zone) => (
                  <Chip key={z.id} label={z.name} selected={zoneSlug === z.slug} onPress={() => setZoneSlug(z.slug)} />
                ))}
              </View>
              <View style={{ height: spacing.md }} />
              <Input label={t('onboard.address')} value={address} onChangeText={setAddress} />
              <Chip label={t('onboard.hideLocation')} icon={hideExactLocation ? 'checkbox' : 'square-outline'} selected={hideExactLocation} onPress={() => setHideExactLocation((v) => !v)} />
            </>
          ) : null}

          {current === 'capacity' ? (
            <Input label={t('onboard.capacity')} value={capacity} onChangeText={setCapacity} keyboardType="number-pad" />
          ) : null}

          {current === 'review' ? (
            <>
              <Text variant="meta" muted style={styles.label}>{t('onboard.reviewHint')}</Text>
              <Card style={{ padding: spacing.lg }}>
                <ReviewRow label={t('onboard.name')} value={name.trim()} />
                <ReviewRow label={t('onboard.category')} value={selectedCategory ? catName(selectedCategory) : '—'} />
                <ReviewRow label="Bannière" value={bannerMode === 'default' ? 'Bannière par défaut automatique' : 'Bannière personnalisée'} />
                <ReviewRow label={t('onboard.modes')} value={modes.map((m) => t(`mode.${m}` as TranslationKey)).join(', ') || '—'} />
                <ReviewRow label={t('onboard.zone')} value={selectedZone?.name ?? '—'} />
                <ReviewRow label={t('onboard.address')} value={hideExactLocation ? t('onboard.hideLocation') : address.trim() || '—'} />
                {modes.includes('APPOINTMENT') ? (
                  <ReviewRow label={t('onboard.capacity')} value={capacity || '1'} />
                ) : null}
              </Card>
              {err ? <Text variant="meta" color={palette.errorRed} style={{ marginTop: spacing.md }}>{err}</Text> : null}
            </>
          ) : null}
        </KeyboardScroll>

        <GlassFooter inline>
          {!isLast ? (
            <Button label={t(current === 'intro' ? 'onboard.introCta' : 'common.next')} disabled={!canNext} onPress={() => setStep(step + 1)} />
          ) : (
            <Button label={t('onboard.submit')} loading={submitting} onPress={submit} />
          )}
        </GlassFooter>
      </View>
    </SafeAreaView>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text variant="meta" muted>{label}</Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.canvas },
  headerPad: { paddingHorizontal: spacing.lg },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.xl, marginTop: spacing.sm },
  progressDot: { flex: 1, height: 5, borderRadius: 3, backgroundColor: palette.border },
  stepLabel: { paddingHorizontal: spacing.xl, marginTop: spacing.sm },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xxxl },
  label: { marginBottom: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  benefitRow: { flexDirection: 'row', alignItems: 'center' },
  successWrap: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl },
  successIcon: { width: 92, height: 92, borderRadius: 46, backgroundColor: palette.mint, alignItems: 'center', justifyContent: 'center' },
  checklist: { alignSelf: 'stretch', marginTop: spacing.xl, padding: spacing.lg },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  successAction: { alignSelf: 'stretch', marginTop: spacing.xl },
});
