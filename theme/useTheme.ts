import { palette, spacing, radius, type, elevation, modeAccent } from './tokens';

/**
 * Single light theme for now (the brief targets a warm light Mediterranean
 * identity). Exposed via a hook so a dark theme could be added later without
 * touching call sites.
 */
export function useTheme() {
  return { palette, spacing, radius, type, elevation, modeAccent };
}
