import React, { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';
import { spacing } from '@/theme/tokens';

/**
 * Layout width for the homepage concepts.
 *
 * Normally this is the device width. The design-preview route overrides it so a
 * concept can be inspected at tablet and desktop widths on any device; because
 * the override feeds the same hook the concepts use, the breakpoints react
 * exactly as they would on a wider screen.
 */
const LayoutWidthContext = createContext<number | null>(null);

export function LayoutProvider({ width, children }: { width?: number; children: React.ReactNode }) {
  return <LayoutWidthContext.Provider value={width ?? null}>{children}</LayoutWidthContext.Provider>;
}

export function useLayoutWidth(): number {
  const override = useContext(LayoutWidthContext);
  const { width } = useWindowDimensions();
  return override ?? width;
}

export type Breakpoint = 'compact' | 'medium' | 'wide';

/** compact: phones · medium: large phones / tablets · wide: desktop & tablet landscape. */
export function useBreakpoint(): Breakpoint {
  const width = useLayoutWidth();
  if (width < 700) return 'compact';
  if (width < 1024) return 'medium';
  return 'wide';
}

/** Column count per breakpoint, as used by the concept grids. */
export function useColumns(compact = 1, medium = 2, wide = 3): number {
  const bp = useBreakpoint();
  return bp === 'compact' ? compact : bp === 'medium' ? medium : wide;
}

/** Horizontal page gutter, wider on large screens for an intentional measure. */
export function useGutter(): number {
  const bp = useBreakpoint();
  return bp === 'compact' ? spacing.xl : bp === 'medium' ? spacing.xxl : spacing.xxxl;
}

/**
 * Widest reading column. On wide screens the concepts centre their content
 * instead of stretching cards across the whole display.
 */
export function useContentMaxWidth(): number | undefined {
  const bp = useBreakpoint();
  return bp === 'wide' ? 1180 : undefined;
}
