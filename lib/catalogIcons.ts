import type { Ionicons } from '@expo/vector-icons';

/** Category slug → Ionicons name. Mirrors the seed data; falls back gracefully. */
export const CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  beaute: 'sparkles-outline',
  automobile: 'car-sport-outline',
  depannage: 'construct-outline',
  gastronomie: 'restaurant-outline',
  commerces: 'storefront-outline',
  education: 'school-outline',
  photographie: 'camera-outline',
  tourisme: 'boat-outline',
  evenementiel: 'balloon-outline',
  'services-pro': 'briefcase-outline',
  artisanat: 'color-palette-outline',
};

export function categoryIcon(slug: string): keyof typeof Ionicons.glyphMap {
  return CATEGORY_ICON[slug] ?? 'storefront-outline';
}
