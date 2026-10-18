import { useCallback, useMemo } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { useLocale } from '@/hooks/useLocale';
import { api } from '@/lib/api';
import type { ApiError } from '@/lib/api';
import type { BusinessSummary, Category, CommerceMode } from '@/types';
import type { HomeData } from './types';

/**
 * Loads the homepage data from the real API: approved businesses (rating order
 * is the server's, no client-side curation), categories and zones.
 */
export function useHomeData(): HomeData & {
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
} {
  const { locale } = useLocale();

  const list = useQuery(() => api.businesses({ sort: 'rating' }), {});
  const categories = useQuery(() => api.categories(), {});
  const zones = useQuery(() => api.zones(), {});

  const categoryName = useCallback(
    (c: Category) => (locale === 'ar' ? c.nameAr : locale === 'en' ? c.nameEn : c.nameFr),
    [locale],
  );

  const businesses = useMemo(() => list.data?.businesses ?? [], [list.data]);
  const cats = useMemo(() => categories.data?.categories ?? [], [categories.data]);
  const zoneList = useMemo(() => zones.data?.zones ?? [], [zones.data]);

  const byMode = useCallback(
    (mode: CommerceMode) => businesses.filter((b) => b.modes.includes(mode)),
    [businesses],
  );
  const withCoords = useMemo(
    () => businesses.filter((b) => b.latitude != null && b.longitude != null),
    [businesses],
  );

  const refetch = useCallback(() => {
    list.refetch();
    categories.refetch();
    zones.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    businesses,
    categories: cats,
    zones: zoneList,
    categoryName,
    byMode,
    withCoords,
    loading: list.loading || categories.loading || zones.loading,
    error: list.error ?? categories.error ?? zones.error ?? null,
    refetch,
  };
}

export type { BusinessSummary };
