import { config } from './config';

export type Locale = 'fr' | 'en' | 'ar';

const DECIMAL_SEP: Record<Locale, string> = { fr: ',', en: '.', ar: ',' };
const THOUSAND_SEP: Record<Locale, string> = { fr: ' ', en: ',', ar: ' ' };

function groupThousands(n: number, locale: Locale): string {
  const s = String(Math.abs(n));
  const parts: string[] = [];
  for (let i = s.length; i > 0; i -= 3) parts.unshift(s.slice(Math.max(0, i - 3), i));
  return (n < 0 ? '-' : '') + parts.join(THOUSAND_SEP[locale]);
}

/**
 * Format integer millimes as a Tunisian dinar string.
 *  - 15000  -> "15 DT"
 *  - 48500  -> "48,500 DT" (fr)  / "48.500 DT" (en)
 * Never uses floating-point arithmetic for the split.
 */
export function formatMillimes(millimes: number, locale: Locale = 'fr'): string {
  const sign = millimes < 0 ? '-' : '';
  const abs = Math.abs(Math.round(millimes));
  const dinars = Math.floor(abs / 1000);
  const frac = abs % 1000;
  const whole = groupThousands(dinars, locale);
  if (frac === 0) return `${sign}${whole} ${config.currency}`;
  const fracStr = String(frac).padStart(3, '0');
  return `${sign}${whole}${DECIMAL_SEP[locale]}${fracStr} ${config.currency}`;
}

/**
 * Parse a user-entered dinar amount ("48,5" / "48.5" / "48") into integer
 * millimes. Returns null if invalid or more than 3 decimals.
 */
export function parseDinarsToMillimes(input: string): number | null {
  const cleaned = input.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,3})?$/.test(cleaned)) return null;
  const [whole, frac = ''] = cleaned.split('.');
  const millimes = parseInt(whole, 10) * 1000 + parseInt(frac.padEnd(3, '0') || '0', 10);
  return millimes;
}

/** Minutes-from-midnight (e.g. 570) → "09:30". */
export function minutesToLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const localeTag: Record<Locale, string> = { fr: 'fr-TN', en: 'en-GB', ar: 'ar-TN' };

function fmt(iso: string, locale: Locale, opts: Intl.DateTimeFormatOptions): string {
  try {
    return new Intl.DateTimeFormat(localeTag[locale], {
      timeZone: config.businessTimezone,
      ...opts,
    }).format(new Date(iso));
  } catch {
    // Fallback if the runtime's Intl lacks timeZone support.
    return new Date(iso).toISOString().replace('T', ' ').slice(0, 16);
  }
}

export function formatTime(iso: string, locale: Locale = 'fr'): string {
  return fmt(iso, locale, { hour: '2-digit', minute: '2-digit', hour12: false });
}
export function formatDate(iso: string, locale: Locale = 'fr'): string {
  return fmt(iso, locale, { weekday: 'short', day: 'numeric', month: 'short' });
}
export function formatDateTime(iso: string, locale: Locale = 'fr'): string {
  return fmt(iso, locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** "dd/mm" compact label for the date selector. */
export function dayNumber(iso: string, locale: Locale = 'fr'): string {
  return fmt(iso, locale, { day: 'numeric' });
}
export function weekdayShort(iso: string, locale: Locale = 'fr'): string {
  return fmt(iso, locale, { weekday: 'short' });
}
