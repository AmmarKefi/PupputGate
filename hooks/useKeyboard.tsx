import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

interface KeyboardState {
  /** Height of the keyboard (0 when hidden). */
  height: number;
  /** Y of the keyboard's top edge in screen coordinates (Infinity when hidden). */
  top: number;
  visible: boolean;
}

const HIDDEN: KeyboardState = { height: 0, top: Number.POSITIVE_INFINITY, visible: false };
const Ctx = createContext<KeyboardState>(HIDDEN);

/**
 * One keyboard listener for the whole app. The app draws edge-to-edge, so the
 * system does not resize the window: screens must read this and make room.
 */
export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<KeyboardState>(HIDDEN);

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) =>
      setState({ height: e.endCoordinates.height, top: e.endCoordinates.screenY, visible: true }),
    );
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setState(HIDDEN),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useKeyboard(): KeyboardState {
  return useContext(Ctx);
}
