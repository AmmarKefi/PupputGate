import { useRouter } from 'expo-router';
import type { BusinessSummary, CommerceMode } from '@/types';

interface ExploreParams {
  q?: string;
  mode?: CommerceMode;
  category?: string;
  zone?: string;
}

/**
 * One place for the homepage's destinations, so a concept can never grow a
 * decorative button: search goes to the working explore screen, cards go to
 * the business profile, and the professional CTA respects the session.
 */
export function useHomeActions() {
  const router = useRouter();

  return {
    explore: (params: ExploreParams = {}) =>
      router.push({
        pathname: '/explore',
        params: {
          ...(params.q ? { q: params.q } : {}),
          ...(params.mode ? { mode: params.mode } : {}),
          ...(params.category ? { category: params.category } : {}),
          ...(params.zone ? { zone: params.zone } : {}),
        },
      }),
    search: (term: string) => {
      const value = term.trim();
      router.push(value ? { pathname: '/explore', params: { q: value } } : '/explore');
    },
    openBusiness: (b: BusinessSummary) => router.push(`/business/${b.slug}`),
    openMap: () => router.push('/map'),
    signIn: () => router.push('/login'),
    joinPro: (guest: boolean) =>
      router.push(
        guest
          ? { pathname: '/register', params: { role: 'MERCHANT' } }
          : '/onboarding/business',
      ),
    activity: () => router.push('/activity'),
  };
}
