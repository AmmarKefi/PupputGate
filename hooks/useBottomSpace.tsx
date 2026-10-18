import React, { createContext, useContext } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tabBar } from '@/theme/tokens';

const TabbedContext = createContext(false);

/** Wrap the tab navigator so descendant screens know a floating tab bar overlays them. */
export function TabbedProvider({ children }: { children: React.ReactNode }) {
  return <TabbedContext.Provider value>{children}</TabbedContext.Provider>;
}

/**
 * Bottom space a scrolling screen must reserve: the system navigation/gesture
 * bar plus, inside the tab navigator, the floating glass tab bar.
 */
export function useBottomSpace(extra = 0) {
  const insets = useSafeAreaInsets();
  const tabbed = useContext(TabbedContext);
  const system = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);
  return {
    system,
    tabbed,
    /** Total padding for scroll content. */
    scroll: system + (tabbed ? tabBar.height + 28 : 24) + extra,
    /** Distance from the screen bottom at which floating UI should rest. */
    floatBottom: system + (tabbed ? tabBar.height + 16 : 12),
  };
}
