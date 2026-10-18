import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { ScrollView, TextInput, View, type ScrollViewProps } from 'react-native';
import { useKeyboard } from '@/hooks/useKeyboard';

interface Ctx {
  /** Scroll the currently focused input above the keyboard. */
  ensureVisible: () => void;
}
const KeyboardScrollContext = createContext<Ctx | null>(null);
export const useKeyboardScroll = () => useContext(KeyboardScrollContext);

const MARGIN = 24;

/**
 * ScrollView that keeps the focused input visible above the keyboard (the app
 * is edge-to-edge, so the window never resizes by itself). Inputs call
 * `ensureVisible` on focus, and it also reacts when the keyboard first opens.
 */
export function KeyboardScroll({
  children,
  onScroll,
  reserve = 0,
  ...rest
}: ScrollViewProps & {
  /** Extra space to keep clear above the keyboard (e.g. a floating action bar). */
  reserve?: number;
}) {
  const ref = useRef<ScrollView>(null);
  const offset = useRef(0);
  const { height, top } = useKeyboard();
  const keyboardTop = useRef(top);
  keyboardTop.current = top;
  const reserveRef = useRef(reserve);
  reserveRef.current = reserve;

  const ensureVisible = useCallback(() => {
    setTimeout(() => {
      const input = TextInput.State.currentlyFocusedInput?.();
      if (!input) return;
      input.measureInWindow((_x, y, _w, h) => {
        const limit = keyboardTop.current - MARGIN - reserveRef.current;
        if (!Number.isFinite(limit)) return;
        const overflow = y + h - limit;
        if (overflow > 0) ref.current?.scrollTo({ y: offset.current + overflow, animated: true });
      });
    }, 90);
  }, []);

  // The keyboard just opened (or changed size): bring the field into view.
  useEffect(() => {
    if (height > 0) ensureVisible();
  }, [height, ensureVisible]);

  const ctx = useMemo<Ctx>(() => ({ ensureVisible }), [ensureVisible]);

  return (
    <KeyboardScrollContext.Provider value={ctx}>
      <ScrollView
        ref={ref}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEventThrottle={16}
        onScroll={(e) => {
          offset.current = e.nativeEvent.contentOffset.y;
          onScroll?.(e);
        }}
        {...rest}
      >
        {children}
        {/* Room to scroll the last field above the keyboard. */}
        <View style={{ height: height > 0 ? height + reserve : 0 }} />
      </ScrollView>
    </KeyboardScrollContext.Provider>
  );
}
