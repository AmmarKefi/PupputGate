import type { ImageSourcePropType } from 'react-native';

/**
 * Generic category photographs bundled with the app. Used as the cover when a
 * business has not uploaded its own image. They illustrate the category only
 * and are never presented as photos of a specific shop.
 */
export const CATEGORY_PHOTOS: Record<string, ImageSourcePropType> = {
  beaute: require('@/assets/home/category-beaute.jpg'),
  automobile: require('@/assets/home/category-automobile.jpg'),
  depannage: require('@/assets/home/category-depannage.jpg'),
  gastronomie: require('@/assets/home/category-gastronomie.jpg'),
  commerces: require('@/assets/home/category-commerces.jpg'),
  education: require('@/assets/home/category-education.jpg'),
  photographie: require('@/assets/home/category-photographie.jpg'),
  tourisme: require('@/assets/home/category-tourisme.jpg'),
  evenementiel: require('@/assets/home/category-evenementiel.jpg'),
  'services-pro': require('@/assets/home/category-services-pro.jpg'),
  artisanat: require('@/assets/home/category-artisanat.jpg'),
  // New categories reuse the closest existing photograph.
  artisans: require('@/assets/home/category-depannage.jpg'),
  'petits-commerces': require('@/assets/home/category-commerces.jpg'),
};

export function categoryPhoto(slug?: string | null): ImageSourcePropType | null {
  return (slug && CATEGORY_PHOTOS[slug]) || null;
}
