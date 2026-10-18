import { fr, type TranslationKey } from './fr';
import { en } from './en';
import { ar } from './ar';

export type { TranslationKey } from './fr';
export type Locale = 'fr' | 'en' | 'ar';

export const dictionaries: Record<Locale, Record<TranslationKey, string>> = { fr, en, ar };

export const RTL_LOCALES: Locale[] = ['ar'];
export const isRtlLocale = (l: Locale) => RTL_LOCALES.includes(l);

export const LOCALE_LABELS: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
};

/** Translate a key with optional {placeholder} interpolation. */
export function translate(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const dict = dictionaries[locale] ?? dictionaries.fr;
  let value = dict[key] ?? dictionaries.fr[key] ?? (key as string);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }
  return value;
}
