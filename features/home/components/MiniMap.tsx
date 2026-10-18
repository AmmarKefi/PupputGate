import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/Text';
import { BusinessTile } from './BusinessTile';
import { modeAccent, palette, radius, spacing } from '@/theme/tokens';
import { useHomeCopy } from '../copy';
import type { BusinessSummary } from '@/types';

// Same defensive loading as the Map tab: react-native-maps exists on native
// only. On web (or if the native module is missing) we fall back to a list.
let MapView: any = null;
let Marker: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const maps = require('react-native-maps');
    MapView = maps.default;
    Marker = maps.Marker;
  } catch {
    MapView = null;
  }
}

function regionFor(points: BusinessSummary[]) {
  const lats = points.map((p) => p.latitude as number);
  const lngs = points.map((p) => p.longitude as number);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max(0.02, (maxLat - minLat) * 1.8),
    longitudeDelta: Math.max(0.02, (maxLng - minLng) * 1.8),
  };
}

/**
 * Map of the businesses that actually have saved coordinates. Nothing is
 * placed anywhere else: a business without coordinates is simply not a pin.
 */
export function MiniMap({
  businesses,
  onSelect,
  height = 260,
  interactive = true,
}: {
  businesses: BusinessSummary[];
  onSelect: (b: BusinessSummary) => void;
  height?: number;
  interactive?: boolean;
}) {
  const copy = useHomeCopy();

  const points = useMemo(
    () => businesses.filter((b) => b.latitude != null && b.longitude != null),
    [businesses],
  );

  // Two different failures, stated honestly: no map module, or nothing to map.
  if (!MapView || points.length === 0) {
    return (
      <View style={[styles.fallback, { minHeight: height }]}>
        <View style={styles.fallbackHead}>
          <Ionicons name="map-outline" size={18} color={palette.forest} />
          <Text variant="bodyStrong" style={{ marginStart: spacing.sm }}>
            {MapView ? copy.aNoCoords : copy.aMapUnavailable}
          </Text>
        </View>
        <Text variant="meta" muted style={{ marginTop: 2, marginBottom: spacing.sm }}>
          {copy.aMapUnavailableHint}
        </Text>
        {businesses.slice(0, 4).map((b) => (
          <BusinessTile key={b.id} business={b} variant="row" onPress={() => onSelect(b)} />
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.mapWrap, { height }]}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={regionFor(points)}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
      >
        {points.map((b) => (
          <Marker
            key={b.id}
            coordinate={{ latitude: b.latitude as number, longitude: b.longitude as number }}
            pinColor={modeAccent[b.primaryMode]}
            title={b.name}
            description={b.zoneName}
            onPress={() => onSelect(b)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: palette.surfaceAlt,
  },
  fallback: {
    borderRadius: radius.card,
    backgroundColor: palette.white,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: palette.border,
    padding: spacing.lg,
  },
  fallbackHead: { flexDirection: 'row', alignItems: 'center' },
});
