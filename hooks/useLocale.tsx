import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';
import { translate, isRtlLocale, type Locale, type TranslationKey } from '@/locales';
import { getPref, setPref } from '@/lib/storage';

interface LocaleContextValue {
  locale: Locale;
  isRTL: boolean;
  ready: boolean;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function deviceDefault(): Locale {
  try {
    const code = getLocales()[0]?.languageCode ?? 'fr';
    if (code === 'ar') return 'ar';
    if (code === 'en') return 'en';
    return 'fr';
  } catch {
    return 'fr';
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = (await getPref('locale')) as Locale | null;
      const initial = saved ?? deviceDefault();
      applyDirection(initial);
      setLocaleState(initial);
      setReady(true);
    })();
  }, []);

  const applyDirection = (l: Locale) => {
    const rtl = isRtlLocale(l);
    try {
      I18nManager.allowRTL(rtl);
      // Best-effort native mirroring; immediate direction is also handled per
      // component via `isRTL` so Arabic reads correctly without a full reload.
      if (I18nManager.isRTL !== rtl) I18nManager.forceRTL(rtl);
    } catch {
      /* ignore */
    }
  };

  const setLocale = useCallback((l: Locale) => {
    applyDirection(l);
    setLocaleState(l);
    void setPref('locale', l);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      isRTL: isRtlLocale(locale),
      ready,
      setLocale,
      t: (key, params) => translate(locale, key, params),
    }),
    [locale, ready, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
