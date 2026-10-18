import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { Button } from '@/components/Button';
import { GlassFooter } from '@/components/GlassFooter';
import { KeyboardScroll } from '@/components/KeyboardScroll';
import { Input } from '@/components/Input';
import { BackHeader } from '@/components/BackHeader';
import { SuccessView } from '@/components/SuccessView';
import { LoadingState, ErrorState, EmptyState } from '@/components/states';
import { palette, radius, spacing, modeAccent } from '@/theme/tokens';
import { useAuth } from '@/hooks/useAuth';
import { useLocale } from '@/hooks/useLocale';
import { useQuery } from '@/hooks/useQuery';
import { api, ApiError } from '@/lib/api';
import { formatMillimes, dayNumber, weekdayShort } from '@/lib/format';
import { haptics } from '@/lib/haptics';
import { signInHref, withQuery } from '@/lib/returnTo';
import type { ServiceItem } from '@/types';

const accent = modeAccent.APPOINTMENT;

export default function BookingFlow() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const loc = locale as 'fr' | 'en' | 'ar';
  const { slug, serviceId: initialServiceId, slot: initialSlot, note: initialNote } = useLocalSearchParams<{
    slug: string;
    serviceId?: string;
    slot?: string;
    note?: string;
  }>();
  const { user } = useAuth();

  const business = useQuery(() => api.business(String(slug)), { deps: [slug] });
  const services = business.data?.business.services ?? [];
  const businessId = business.data?.business.id;

  const [serviceId, setServiceId] = useState<string | null>(initialServiceId ?? null);
  const effectiveServiceId = serviceId ?? services[0]?.id ?? null;
  const service: ServiceItem | undefined = services.find((s) => s.id === effectiveServiceId);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(initialSlot ?? null);
  const [note, setNote] = useState(initialNote ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const slots = useQuery(
    () => api.slots(businessId!, effectiveServiceId!, undefined, 7),
    { enabled: !!businessId && !!effectiveServiceId, deps: [businessId, effectiveServiceId] },
  );

  const days = slots.data?.days ?? [];
  const activeDate = selectedDate ?? days.find((d) => d.slots.some((s) => s.available))?.date ?? days[0]?.date ?? null;
  const daySlots = useMemo(() => days.find((d) => d.date === activeDate)?.slots ?? [], [days, activeDate]);

  async function confirm() {
    if (!businessId || !effectiveServiceId || !selectedSlot) return;
    if (!user) {
      // Guest: keep the chosen service, slot and note, and return here after sign-in.
      router.push(
        signInHref(
          withQuery(`/booking/${slug}`, { serviceId: effectiveServiceId, slot: selectedSlot, note: note || null }),
        ) as never,
      );
      return;
    }
    setSubmitting(true);
    setErrMsg(null);
    try {
      await api.createAppointment({ businessId, serviceId: effectiveServiceId, startIso: selectedSlot, note: note || undefined });
      haptics.success();
      setDone(true);
    } catch (e) {
      haptics.error();
      if (e instanceof ApiError && e.code === 'SLOT_TAKEN') {
        setErrMsg(t('booking.slotTaken'));
        setSelectedSlot(null);
        slots.refetch();
      } else if (e instanceof ApiError && e.code === 'NETWORK') {
        setErrMsg(t('error.network'));
      } else {
        setErrMsg(t('error.generic'));
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (business.loading) return <SafeAreaView style={styles.flex}><LoadingState /></SafeAreaView>;
  if (business.error || !business.data) return <SafeAreaView style={styles.flex}><ErrorState error={business.error} onRetry={business.refetch} /></SafeAreaView>;

  if (done) {
    const slotLabel = daySlots.find((s) => s.startIso === selectedSlot)?.label;
    return (
      <SuccessView
        accent={accent}
        title={t('booking.success')}
        hint={t('booking.successHint')}
        rows={[
          { icon: 'storefront-outline', label: business.data.business.name, value: business.data.business.zoneName },
          ...(service
            ? [{ icon: 'cut-outline' as const, label: service.name, value: formatMillimes(service.priceMillimes, loc) }]
            : []),
          ...(activeDate && slotLabel
            ? [
                {
                  icon: 'calendar-outline' as const,
                  label: `${weekdayShort(activeDate + 'T12:00:00Z', loc)} ${dayNumber(activeDate + 'T12:00:00Z', loc)}`,
                  value: slotLabel,
                },
              ]
            : []),
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
      <View style={styles.headerPad}>
        <BackHeader title={business.data.business.name} />
      </View>
      <KeyboardScroll reserve={112} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Service selection */}
        <Text variant="section" style={styles.h}>{t('booking.chooseService')}</Text>
        {services.map((s) => {
          const sel = s.id === effectiveServiceId;
          return (
            <Pressable key={s.id} onPress={() => { setServiceId(s.id); setSelectedSlot(null); }}
              style={[styles.serviceRow, sel && { borderColor: accent, backgroundColor: `${accent}0D` }]}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{s.name}</Text>
                <Text variant="meta" muted>{s.durationMin} {t('booking.min')} · {formatMillimes(s.priceMillimes, loc)}</Text>
              </View>
              <Ionicons name={sel ? 'radio-button-on' : 'radio-button-off'} size={20} color={sel ? accent : palette.border} />
            </Pressable>
          );
        })}

        {/* Date selector */}
        <Text variant="section" style={styles.h}>{t('booking.chooseDate')}</Text>
        {slots.loading ? (
          <LoadingState />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {days.map((d) => {
              const sel = d.date === activeDate;
              const hasAvail = d.slots.some((s) => s.available);
              return (
                <Pressable key={d.date} onPress={() => { setSelectedDate(d.date); setSelectedSlot(null); }}
                  style={[styles.dayChip, sel && { backgroundColor: accent, borderColor: accent }, !hasAvail && styles.dayDisabled]}>
                  <Text variant="meta" color={sel ? palette.white : palette.mutedText}>{weekdayShort(d.date + 'T12:00:00Z', loc)}</Text>
                  <Text variant="bodyStrong" color={sel ? palette.white : palette.ink}>{dayNumber(d.date + 'T12:00:00Z', loc)}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Slots */}
        <Text variant="section" style={styles.h}>{t('booking.chooseSlot')}</Text>
        {daySlots.filter((s) => s.available).length === 0 ? (
          <EmptyState icon="time-outline" title={t('booking.noSlots')} hint={t('booking.noSlotsHint')} />
        ) : (
          <View style={styles.slotGrid}>
            {daySlots.filter((s) => s.available).map((s) => {
              const sel = s.startIso === selectedSlot;
              return (
                <Pressable key={s.startIso} onPress={() => setSelectedSlot(s.startIso)}
                  style={[styles.slot, sel && { backgroundColor: accent, borderColor: accent }]}>
                  <Text variant="meta" color={sel ? palette.white : palette.ink}>{s.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Note */}
        <Text variant="section" style={styles.h}>{t('booking.note')}</Text>
        <Input value={note} onChangeText={setNote} placeholder={t('booking.notePlaceholder')} multiline />

        {errMsg ? <Text variant="meta" color={palette.errorRed}>{errMsg}</Text> : null}
      </KeyboardScroll>

      {/* Footer summary + confirm */}
      <GlassFooter>
        {service ? (
          <View style={styles.summaryRow}>
            <Text variant="meta" muted>{service.name} · {service.durationMin} {t('booking.min')}</Text>
            <Text variant="bodyStrong" color={accent}>{formatMillimes(service.priceMillimes, loc)}</Text>
          </View>
        ) : null}
        <Text variant="meta" muted style={{ marginBottom: spacing.sm }}>{t('booking.successHint')}</Text>
        <Button label={t('booking.confirm')} accent={accent} disabled={!selectedSlot} loading={submitting} onPress={confirm} />
      </GlassFooter>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.canvas },
  headerPad: { paddingHorizontal: spacing.lg },
  content: { paddingHorizontal: spacing.xl, paddingBottom: 160 },
  h: { marginTop: spacing.xl, marginBottom: spacing.md },
  serviceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.white, borderRadius: radius.card, borderWidth: 1.5, borderColor: palette.border, padding: spacing.lg, marginBottom: spacing.sm },
  dayChip: { width: 56, alignItems: 'center', backgroundColor: palette.white, borderRadius: radius.card, borderWidth: 1, borderColor: palette.border, paddingVertical: spacing.md, gap: 2 },
  dayDisabled: { opacity: 0.4 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: { minWidth: 72, alignItems: 'center', backgroundColor: palette.white, borderRadius: radius.input, borderWidth: 1, borderColor: palette.border, paddingVertical: 10, paddingHorizontal: spacing.md },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: palette.white, borderTopWidth: 1, borderTopColor: palette.border, padding: spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl },
  successIcon: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
});
