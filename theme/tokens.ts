/**
 * PupputGate design tokens — the single source of truth for colour, type,
 * spacing, radius and elevation. Never hardcode hex values in screens; import
 * from here (or from `useTheme`).
 */

export const palette = {
  // PupputGate's local-market palette: vivid Mediterranean teal, clean white,
  // warm citrus and a small coral accent. Existing token names stay stable so
  // every screen picks up the refreshed brand without per-screen overrides.
  ink: '#172725',
  mutedText: '#687A77',
  canvas: '#F7FAFA',
  white: '#FFFFFF',
  forest: '#008078',
  deepGreen: '#00665D',
  mint: '#DDF3F0',
  leaf: '#B8E8E2',
  border: 'rgba(0,79,72,0.10)',
  sand: '#FFD85A',
  terracotta: '#A94D24',
  errorRed: '#B64F45',
  // derived surfaces
  surface: '#FFFFFF',
  surfaceAlt: '#EDF4F3',
  overlay: 'rgba(0,63,57,0.56)',
  shadow: 'rgba(0,54,49,0.12)',
} as const;

/** Reference-matched bright teal used behind the home status bar and hero. */
export const brandTeal = '#18B3AA';
export const brandGradient = [brandTeal, brandTeal, brandTeal] as const;

/** Frosted "Liquid Glass" fills used where real blur is unavailable. */
export const glass = {
  fill: 'rgba(255,255,255,0.92)',
  fillStrong: 'rgba(255,255,255,0.98)',
  fillDark: 'rgba(0,102,93,0.82)',
  stroke: 'rgba(255,255,255,0.78)',
  strokeSoft: 'rgba(0,79,72,0.08)',
  highlight: 'rgba(255,255,255,0.96)',
} as const;

/** Commerce-mode accent colours (brief §5). */
export const modeAccent = {
  APPOINTMENT: '#008078',
  ORDER: '#A94D24',
  SHOWCASE: '#704A94',
  QUOTE: '#24628A',
} as const;

export type CommerceMode = keyof typeof modeAccent;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Continuous-feeling, generous radii (concentric with the device corners). */
export const radius = {
  input: 16,
  button: 18,
  card: 24,
  editorial: 32,
  pill: 999,
} as const;

export const type = {
  hero: { fontSize: 36, lineHeight: 42, fontWeight: '800' as const, letterSpacing: -0.8 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const, letterSpacing: -0.5 },
  section: { fontSize: 21, lineHeight: 27, fontWeight: '700' as const, letterSpacing: -0.3 },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const, letterSpacing: -0.15 },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' as const, letterSpacing: -0.1 },
  meta: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  eyebrow: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: '700' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
} as const;

export const elevation = {
  none: {},
  soft: {
    shadowColor: '#1D2B26',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  lifted: {
    shadowColor: '#1D2B26',
    shadowOpacity: 0.16,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
} as const;

export const hairline = {
  borderColor: palette.border,
  borderWidth: 1,
} as const;

/** Floating tab bar metrics (also used to pad scroll content). */
export const tabBar = {
  height: 64,
  margin: 12,
} as const;
