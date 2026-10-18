import { useCallback, useEffect, useState } from 'react';
import { useLocale } from '@/hooks/useLocale';
import { api } from '@/lib/api';
import type { Category } from '@/types';

// Categories rarely change: load them once for the whole app and share them.
let cache: Category[] | null = null;
let inflight = false;
const listeners = new Set<() => void>();

function load() {
  if (cache || inflight) return;
  inflight = true;
  api
    .categories()
    .then((r) => {
      cache = r.categories;
      listeners.forEach((fn) => fn());
    })
    .catch(() => {})
    .finally(() => {
      inflight = false;
    });
}

/** Returns `labelFor(slug)` → the category's name in the current language. */
export function useCategoryLabel() {
  const { locale } = useLocale();
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const fn = () => setVersion((n) => n + 1);
    listeners.add(fn);
    load();
    return () => {
      listeners.delete(fn);
    };
  }, []);

  return useCallback(
    (slug?: string | null): string => {
      const c = cache?.find((x) => x.slug === slug);
      if (!c) return '';
      return locale === 'ar' ? c.nameAr : locale === 'en' ? c.nameEn : c.nameFr;
    },
    // `version` changes when the shared list arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, version],
  );
}
