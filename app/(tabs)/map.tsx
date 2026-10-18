import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Linking,
  FlatList,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Glass } from '@/components/Glass';
import { LeafletMap, type MapPoint } from '@/components/LeafletMap';
import { useBottomSpace } from '@/hooks/useBottomSpace';
import { Text } from '@/components/Text';
import { Chip } from '@/components/Chip';
import { BusinessCard } from '@/components/BusinessCard';
import { Rating } from '@/components/Rating';
import { EmptyState, LoadingState } from '@/components/states';
import { palette, radius, spacing, modeAccent } from '@/theme/tokens';
import { categoryPhoto } from '@/lib/categoryPhotos';
import { assetUrl } from '@/lib/assets';
import { formatMillimes } from '@/lib/format';
import { useLocale } from '@/hooks/useLocale';
import { useQuery } from '@/hooks/useQuery';
import { haptics } from '@/lib/haptics';
import { api } from '@/lib/api';
import type { BusinessSummary, Zone } from '@/types';

// The interactive map is a keyless Leaflet map in a WebView (native only);
// on web we fall back to the list experience.
const MAP_AVAILABLE = Platform.OS !== 'web';

export default function MapScreen() {
  const router = useRouter();
  const { t, locale, isRTL } = useLocale();
  const space = useBottomSpace();
  const { width: screenW } = useWindowDimensions();
  const params = useLocalSearchParams<{ mode?: string; zone?: string; category?: string }>();
  const railRef = useRef<FlatList<BusinessSummary>>(null);

  const CARD_W = Math.min(320, screenW * 0.82);
  const CARD_GAP = spacing.md;
  const SNAP = CARD_W + CARD_GAP;

  const [zone, setZone] = useState<string | null>(params.zone || null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [forceList, setForceList] = useState(false);

  const zones = useQuery(() => api.zones(), {});
  const list = useQuery(
    () =>
      api.businesses({
        mode: params.mode || undefined,
        category: params.category || undefined,
        zone: zone ?? undefined,
        lat: coords?.lat,
        lng: coords?.lng,
      }),
    { deps: [zone, coords?.lat, coords?.lng] },
  );

  const businesses = list.data?.businesses ?? [];
  const mapped = useMemo(
    () => businesses.filter((b) => b.latitude != null && b.longitude != null),
    [businesses],
  );

  // The map component flies its own camera when the selection changes.
  const focusBusiness = useCallback((b: BusinessSummary) => {
    setSelectedId(b.id);
  }, []);

  const points = useMemo<MapPoint[]>(
    () =>
      mapped.map((b) => ({
        id: b.id,
        lat: b.latitude!,
        lng: b.longitude!,
        name: b.name,
        color: modeAccent[b.primaryMode],
      })),
    [mapped],
  );

  // Tapping a pin selects it and scrolls the carousel to match.
  const onMarkerPress = useCallback(
    (b: BusinessSummary) => {
      haptics.tap();
      focusBusiness(b);
      const i = mapped.findIndex((m) => m.id === b.id);
      if (i >= 0) railRef.current?.scrollToOffset({ offset: i * SNAP, animated: true });
    },
    [focusBusiness, mapped, SNAP],
  );

  // Swiping the carousel drives the camera.
  const onRailSettle = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / SNAP);
      const b = mapped[i];
      if (b && b.id !== selectedId) focusBusiness(b);
    },
    [SNAP, mapped, selectedId, focusBusiness],
  );

  async function requestLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setLocationDenied(true);
      return;
    }
    setLocationDenied(false);
    const pos = await Location.getCurrentPositionAsync({});
    const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setCoords(c);
  }

  function openDirections(b: BusinessSummary) {
    if (b.latitude == null || b.longitude == null) return;
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${b.latitude},${b.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}`,
    });
    Linking.openURL(url!).catch(() => {});
  }

  const mapAvailable = MAP_AVAILABLE && !forceList;

  function renderCard({ item: b }: { item: BusinessSummary }) {
    const accent = modeAccent[b.primaryMode];
    const photoUri = assetUrl(b.coverImage);
    const photo = photoUri ? { uri: photoUri } : categoryPhoto(b.categorySlug);
    const price =
      b.primaryMode === 'APPOINTMENT' && b.nextSlotLabel
        ? `${t('business.nextSlot')} · ${b.nextSlotLabel}`
        : b.priceFromMillimes != null
          ? `${t('common.from')} ${formatMillimes(b.priceFromMillimes, locale)}`
          : t('common.payOnSite');
    return (
      <Pressable
        onPress={() => router.push(`/business/${b.slug}`)}
        style={[styles.card, { width: CARD_W }]}
        accessibilityRole="button"
        accessibilityLabel={b.name}
      >
        <View style={styles.cardThumb}>
          {photo ? (
            <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: `${accent}22` }]} />
          )}
        </View>
        <View style={styles.cardBody}>
          <Text variant="bodyStrong" numberOfLines={1}>
            {b.name}
          </Text>
          <View style={[styles.cardMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Ionicons name="location" size={12} color={accent} />
            <Text variant="meta" muted numberOfLines={1} style={{ marginHorizontal: 3, flex: 1 }}>
              {b.zoneName}
              {b.distanceKm != null ? ` · ${b.distanceKm} ${t('common.km')}` : ''}
            </Text>
            <Rating avg={b.ratingAvg} count={b.ratingCount} size={12} />
          </View>
          <View style={[styles.cardFoot, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text variant="meta" color={accent} numberOfLines={1} style={{ flex: 1 }}>
              {price}
            </Text>
            <Pressable onPress={() => openDirections(b)} hitSlop={8} style={[styles.dirBtn, { backgroundColor: `${accent}16` }]}>
              <Ionicons name="navigate" size={15} color={accent} />
            </Pressable>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.flex}>
      <View style={styles.header}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text variant="title">{t('map.title')}</Text>
          {MAP_AVAILABLE ? (
            <Pressable onPress={() => setForceList((v) => !v)} style={styles.listToggle} accessibilityRole="button">
              <Ionicons name={forceList ? 'map' : 'list'} size={15} color={palette.white} />
              <Text variant="meta" color={palette.white} style={{ marginHorizontal: 5, fontWeight: '700' }}>
                {forceList ? t('explore.map') : t('explore.list')}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.zoneRow}>
          <Chip label={t('home.allZones')} selected={!zone} onPress={() => setZone(null)} />
          {(zones.data?.zones ?? []).map((z: Zone) => (
            <Chip key={z.id} label={z.name} icon="location-outline" selected={zone === z.slug} onPress={() => setZone(z.slug)} />
          ))}
        </ScrollView>
      </View>

      {list.loading ? (
        <LoadingState />
      ) : mapAvailable ? (
        <View style={styles.flex}>
          <LeafletMap
            points={points}
            selectedId={selectedId}
            userLocation={coords}
            padding={{ top: 140, bottom: 300 }}
            onSelect={(id) => {
              if (!id) return setSelectedId(null);
              const b = mapped.find((m) => m.id === id);
              if (b) onMarkerPress(b);
            }}
          />

          {/* top scrim keeps the zone chips legible over busy tiles */}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(247,250,250,0.9)', 'rgba(247,250,250,0)']}
            style={styles.topFade}
          />

          <Pressable
            style={[styles.locBtn, { bottom: space.floatBottom + 150 }, isRTL ? { left: spacing.xl } : { right: spacing.xl }]}
            onPress={requestLocation}
            accessibilityRole="button"
            accessibilityLabel={t('map.enableLocation')}
          >
            <Glass radius={25} intensity={70}>
              <View style={styles.locInner}>
                <Ionicons name="locate" size={22} color={palette.forest} />
              </View>
            </Glass>
          </Pressable>

          {locationDenied ? (
            <View style={[styles.deniedBanner, { top: 120 }]}>
              <Text variant="meta" color={palette.white}>
                {t('map.locationDeniedHint')}
              </Text>
            </View>
          ) : null}

          {/* Synced carousel: swipe to fly the camera, tap to open. */}
          {mapped.length > 0 ? (
            <Animated.View entering={FadeInUp.duration(320)} style={[styles.rail, { bottom: space.floatBottom + 4 }]}>
              <FlatList
                ref={railRef}
                data={mapped}
                keyExtractor={(b) => b.id}
                renderItem={renderCard}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={SNAP}
                decelerationRate="fast"
                onMomentumScrollEnd={onRailSettle}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: CARD_GAP }}
              />
            </Animated.View>
          ) : (
            <View style={[styles.emptyFloat, { bottom: space.floatBottom + 20 }]}>
              <Glass radius={radius.card} intensity={80}>
                <View style={{ padding: spacing.lg }}>
                  <Text variant="bodyStrong" center>
                    {t('explore.noResults')}
                  </Text>
                  <Text variant="meta" muted center style={{ marginTop: 2 }}>
                    {t('explore.noResultsHint')}
                  </Text>
                </View>
              </Glass>
            </View>
          )}
        </View>
      ) : (
        // Fallback: list + zones + directions when the map is unavailable.
        <ScrollView contentContainerStyle={[styles.fallback, { paddingBottom: space.scroll }]} showsVerticalScrollIndicator={false}>
          {mapped.length === 0 ? (
            <EmptyState icon="map-outline" title={t('explore.noResults')} hint={t('explore.noResultsHint')} />
          ) : (
            mapped.map((b) => (
              <View key={b.id}>
                <BusinessCard business={b} onPress={() => router.push(`/business/${b.slug}`)} />
                <Pressable onPress={() => openDirections(b)} style={styles.dirRow}>
                  <Ionicons name="navigate-outline" size={16} color={palette.forest} />
                  <Text variant="meta" color={palette.forest} style={{ marginHorizontal: 4 }}>
                    {t('map.directions')}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.canvas },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.sm, paddingBottom: spacing.sm },
  headerRow: { justifyContent: 'space-between', alignItems: 'center' },
  listToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.forest, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  zoneRow: { paddingVertical: spacing.xs, gap: 0 },
  topFade: { position: 'absolute', top: 0, left: 0, right: 0, height: 24 },
  locBtn: { position: 'absolute' },
  locInner: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  deniedBanner: { position: 'absolute', left: spacing.xl, right: spacing.xl, backgroundColor: palette.deepGreen, padding: spacing.md, borderRadius: radius.card },
  rail: { position: 'absolute', left: 0, right: 0 },
  card: {
    flexDirection: 'row',
    backgroundColor: palette.white,
    borderRadius: radius.card,
    overflow: 'hidden',
    padding: spacing.sm,
    shadowColor: '#003F3A',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  cardThumb: { width: 86, height: 86, borderRadius: radius.input, overflow: 'hidden', backgroundColor: palette.surfaceAlt },
  cardBody: { flex: 1, marginStart: spacing.md, justifyContent: 'center', paddingEnd: spacing.xs },
  cardMeta: { alignItems: 'center', marginTop: 4 },
  cardFoot: { alignItems: 'center', marginTop: 6, gap: spacing.sm },
  dirBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  emptyFloat: { position: 'absolute', left: spacing.xl, right: spacing.xl },
  fallback: { padding: spacing.xl },
  dirRow: { flexDirection: 'row', alignItems: 'center', marginTop: -spacing.sm, marginBottom: spacing.lg, paddingHorizontal: spacing.xs },
});
