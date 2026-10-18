import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '@/theme/tokens';

type Glyph = keyof typeof MaterialCommunityIcons.glyphMap;
type Tone = readonly [string, string, string];

/** Category slug → glyph and its own glossy colour ramp (light → deep). */
const SPEC: Record<string, { glyph: Glyph; tone: Tone }> = {
  beaute: { glyph: 'content-cut', tone: ['#FF9DBD', '#F0508A', '#C0295F'] },
  automobile: { glyph: 'steering', tone: ['#7DBBFF', '#2F7CF0', '#1B50BC'] },
  depannage: { glyph: 'hammer-wrench', tone: ['#FFB873', '#F2802B', '#BD5710'] },
  gastronomie: { glyph: 'silverware-fork-knife', tone: ['#FF9F90', '#EF5B4C', '#BC362C'] },
  commerces: { glyph: 'shopping-outline', tone: ['#BEA3FF', '#8A63EE', '#623DC2'] },
  education: { glyph: 'school', tone: ['#8CB0FF', '#4C6FE0', '#2F44A6'] },
  photographie: { glyph: 'camera', tone: ['#8D9DB5', '#52627B', '#2D3A50'] },
  tourisme: { glyph: 'umbrella-beach', tone: ['#74E5F4', '#1FB5D1', '#0A8199'] },
  evenementiel: { glyph: 'party-popper', tone: ['#FFDB7A', '#F5A623', '#C97A06'] },
  'services-pro': { glyph: 'briefcase', tone: ['#38D6CB', '#12A79E', '#00756D'] },
  artisanat: { glyph: 'palette', tone: ['#E8AC84', '#C0723F', '#8D4522'] },
  artisans: { glyph: 'tools', tone: ['#9DB4C6', '#587B96', '#344F66'] },
  'petits-commerces': { glyph: 'basket', tone: ['#A6E07F', '#55B24E', '#33802F'] },
};
const FALLBACK = { glyph: 'storefront-outline' as Glyph, tone: ['#38D6CB', '#12A79E', '#00756D'] as Tone };

/** Accent colour of a category (used for tints elsewhere). */
export function categoryTone(slug: string): string {
  return (SPEC[slug] ?? FALLBACK).tone[1];
}

/**
 * Category mark: glossy colour disc, white glyph, citrus accent dot. Every
 * category has its own colour. Pure views + one gradient, so it stays cheap
 * to animate at 60fps.
 */
export function CategoryGlyph({ slug, size }: { slug: string; size: number }) {
  const { glyph, tone } = SPEC[slug] ?? FALLBACK;
  const dot = size * 0.24;
  return (
    <View style={{ width: size, height: size }}>
      <LinearGradient
        colors={[tone[0], tone[1], tone[2]]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={[styles.disc, { borderRadius: size / 2 }]}
      >
        <View style={[styles.gloss, { width: size * 0.72, height: size * 0.36, borderRadius: size * 0.36, top: size * 0.06 }]} />
        <MaterialCommunityIcons name={glyph} size={size * 0.54} color={palette.white} />
      </LinearGradient>
      <View
        style={[
          styles.dot,
          { width: dot, height: dot, borderRadius: dot / 2, top: size * 0.02, right: size * 0.02, borderWidth: size * 0.04 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  disc: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
  },
  gloss: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.22)' },
  dot: { position: 'absolute', backgroundColor: palette.sand, borderColor: palette.white },
});
