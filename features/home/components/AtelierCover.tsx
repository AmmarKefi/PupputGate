import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { Text } from '@/components/Text';
import { palette } from '@/theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;

/**
 * Editorial cover used instead of stock photography.
 *
 * The project holds no photography of these businesses, and using unrelated
 * stock images would imply they exist. Instead each cover is a composed
 * poster: a category-tinted ground, a geometric motif chosen deterministically
 * from the slug, and the business monogram. It reads as one designed system
 * rather than a missing-image placeholder, and works offline.
 */
export function AtelierCover({
  seed,
  name,
  accent,
  icon,
  ratio = 1.5,
  variant = 'light',
  showMonogram = true,
  showIcon = true,
}: {
  seed: string;
  name: string;
  accent: string;
  icon?: IconName;
  /** width / height. 1.5 ≈ landscape 3:2, 1.15 ≈ portrait. */
  ratio?: number;
  variant?: 'light' | 'dark';
  showMonogram?: boolean;
  showIcon?: boolean;
}) {
  const dark = variant === 'dark';
  const tint = dark ? accent : `${accent}0F`;
  const line = dark ? 'rgba(255,255,255,0.22)' : `${accent}2E`;
  const monogram = name.trim().slice(0, 1).toUpperCase() || '·';
  const motif = hash(seed) % 4;

  return (
    <View style={[styles.wrap, { aspectRatio: ratio, backgroundColor: tint }]}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
        {motif === 0 ? (
          <>
            <Circle cx="78" cy="82" r="46" stroke={line} strokeWidth="0.8" fill="none" />
            <Circle cx="78" cy="82" r="32" stroke={line} strokeWidth="0.8" fill="none" />
            <Circle cx="78" cy="82" r="18" stroke={line} strokeWidth="0.8" fill="none" />
          </>
        ) : null}
        {motif === 1 ? (
          <>
            {Array.from({ length: 9 }).map((_, i) => (
              <Line
                key={i}
                x1={-20 + i * 16}
                y1={112}
                x2={30 + i * 16}
                y2={-12}
                stroke={line}
                strokeWidth="0.8"
              />
            ))}
          </>
        ) : null}
        {motif === 2 ? (
          <>
            {Array.from({ length: 7 }).map((_, i) => (
              <Line
                key={i}
                x1={0}
                y1={16 + i * 12}
                x2={100}
                y2={16 + i * 12}
                stroke={line}
                strokeWidth="0.8"
              />
            ))}
            <Rect x="62" y="0" width="38" height="26" fill={dark ? 'rgba(255,255,255,0.10)' : `${accent}14`} />
          </>
        ) : null}
        {motif === 3 ? (
          <>
            {Array.from({ length: 3 }).map((_, row) =>
              Array.from({ length: 3 }).map((__, col) => (
                <Path
                  key={`${row}-${col}`}
                  d={`M ${8 + col * 32} ${26 + row * 32} a 20 20 0 0 1 20 20`}
                  stroke={line}
                  strokeWidth="0.9"
                  fill="none"
                />
              )),
            )}
          </>
        ) : null}
      </Svg>

      {showIcon && icon ? (
        <View style={[styles.iconChip, { borderColor: line }]}>
          <Ionicons name={icon} size={14} color={dark ? palette.white : accent} />
        </View>
      ) : null}

      {showMonogram ? (
        <Text
          style={[styles.monogram, { color: dark ? 'rgba(255,255,255,0.92)' : `${accent}D9` }]}
          numberOfLines={1}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {monogram}
        </Text>
      ) : null}
    </View>
  );
}

function hash(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h;
}

const styles = StyleSheet.create({
  wrap: { width: '100%', overflow: 'hidden', justifyContent: 'flex-end' },
  iconChip: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  monogram: {
    fontSize: 54,
    lineHeight: 62,
    fontWeight: '800',
    letterSpacing: -2,
    marginLeft: 12,
    marginBottom: 2,
  },
});
