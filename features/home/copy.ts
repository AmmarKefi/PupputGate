/**
 * Copy for the five homepage concepts (A–E).
 *
 * Kept beside the concepts rather than in the global dictionary: these strings
 * are design-direction specific and must not leak into the rest of the app.
 * Shared UI strings still come from `useLocale().t`.
 */
import { useLocale } from '@/hooks/useLocale';
import type { Locale } from '@/locales';
import type { CommerceMode } from '@/types';

export interface SearchPrompt {
  label: string;
  /** Real filters handed to /explore — never decorative. */
  params: { q?: string; mode?: CommerceMode; category?: string };
}

export interface HomeCopy {
  // Shared
  nearby: string;
  mapTitle: string;
  mapHint: string;
  seeProfile: string;
  proTitle: string;
  proBody: string;
  proCta: string;
  emptyTitle: string;
  emptyBody: string;
  emptyProCta: string;
  langLabel: string;
  // A — local discovery map
  aHeadline: string;
  aSupport: string;
  aExplore: string;
  aServices: string;
  aMap: string;
  aList: string;
  aAll: string;
  aMapUnavailable: string;
  aMapUnavailableHint: string;
  aNoCoords: string;
  aAddresses: string;
  // B — one search
  bHeadline: string;
  bSupport: string;
  bTry: string;
  bPrompts: SearchPrompt[];
  bCategories: string;
  bDiscover: string;
  // C — local magazine
  cMasthead: string;
  cHeadline: string;
  cSupport: string;
  cStory: string;
  cAddresses: string;
  cDaily: string;
  cShops: string;
  cRead: string;
  // D — three ways
  dHeadline: string;
  dSupport: string;
  dBook: string;
  dBookDesc: string;
  dOrder: string;
  dOrderDesc: string;
  dPro: string;
  dProDesc: string;
  dBusinesses: string;
  dCategories: string;
  // E — premium marketplace
  eHeadline: string;
  eSupport: string;
  eDiscover: string;
  eShops: string;
  eServices: string;
}

const fr: HomeCopy = {
  nearby: 'Près de chez vous',
  mapTitle: 'Hammamet, quartier par quartier',
  mapHint: 'Les commerces et professionnels référencés, à leur adresse.',
  seeProfile: 'Voir la fiche',
  proTitle: 'Vous êtes professionnel ?',
  proBody:
    'Présentez votre activité, recevez des demandes et gérez vos réservations, commandes et devis depuis un seul espace.',
  proCta: 'Rejoindre PupputGate',
  emptyTitle: 'Aucun commerce publié pour le moment',
  emptyBody:
    'Les commerces apparaîtront ici dès leur validation. Vous êtes professionnel ? Créez votre fiche dès maintenant.',
  emptyProCta: 'Créer ma fiche',
  langLabel: 'Langue',

  aHeadline: 'Tout ce dont vous avez besoin, près de chez vous.',
  aSupport: 'Commerces, artisans et services à Hammamet. Trouvez le bon professionnel en quelques clics.',
  aExplore: 'Explorer les adresses',
  aServices: 'Découvrir les services',
  aMap: 'Carte',
  aList: 'Liste',
  aAll: 'Tout',
  aMapUnavailable: 'Carte indisponible',
  aMapUnavailableHint: 'Voici les adresses en liste, avec leur quartier.',
  aNoCoords: 'Aucune adresse géolocalisée',
  aAddresses: 'Les adresses à Hammamet',

  bHeadline: 'Vous cherchez quoi aujourd’hui ?',
  bSupport: 'Un rendez-vous, un bon gâteau ou un artisan de confiance ? Tout commence ici.',
  bTry: 'Essayez',
  bPrompts: [
    { label: 'Un coiffeur près de moi', params: { category: 'beaute' } },
    { label: 'Commander un gâteau', params: { mode: 'ORDER', q: 'gâteau' } },
    { label: 'Trouver un plombier', params: { category: 'depannage' } },
    { label: 'Un garage à Hammamet', params: { category: 'automobile' } },
  ],
  bCategories: 'Par catégorie',
  bDiscover: 'À découvrir près de chez vous',

  cMasthead: 'PupputGate · Hammamet',
  cHeadline: 'Les bonnes adresses de Hammamet.',
  cSupport: 'Découvrez les commerces et les professionnels qui font vivre votre ville.',
  cStory: 'À la une',
  cAddresses: 'Les bonnes adresses',
  cDaily: 'Les services du quotidien',
  cShops: 'Les commerces à découvrir',
  cRead: 'Lire la fiche',

  dHeadline: 'Le bon service. Le bon commerce. Au bon moment.',
  dSupport: 'Réservez, commandez ou trouvez un professionnel à Hammamet.',
  dBook: 'Réserver',
  dBookDesc: 'Choisissez une prestation et un créneau disponible.',
  dOrder: 'Commander',
  dOrderDesc: 'Découvrez les produits des boutiques et pâtisseries locales.',
  dPro: 'Trouver un pro',
  dProDesc: 'Décrivez votre besoin et recevez un devis d’un professionnel.',
  dBusinesses: 'Commerces à découvrir',
  dCategories: 'Catégories populaires',

  eHeadline: 'Hammamet a ses bonnes adresses. Trouvez les vôtres.',
  eSupport: 'Explorez les commerces locaux, réservez vos services et commandez près de chez vous.',
  eDiscover: 'À découvrir',
  eShops: 'Commerces',
  eServices: 'Services',
};

const en: HomeCopy = {
  nearby: 'Near you',
  mapTitle: 'Hammamet, neighbourhood by neighbourhood',
  mapHint: 'Listed businesses and professionals, at their address.',
  seeProfile: 'View listing',
  proTitle: 'Are you a business owner?',
  proBody:
    'Present your business, receive requests and manage bookings, orders and quotes from a single workspace.',
  proCta: 'Join PupputGate',
  emptyTitle: 'No businesses published yet',
  emptyBody:
    'Businesses appear here once approved. Are you a professional? Create your listing now.',
  emptyProCta: 'Create my listing',
  langLabel: 'Language',

  aHeadline: 'Everything you need, close to home.',
  aSupport: 'Shops, craftspeople and services in Hammamet. Find the right professional in a few taps.',
  aExplore: 'Explore the addresses',
  aServices: 'Discover services',
  aMap: 'Map',
  aList: 'List',
  aAll: 'All',
  aMapUnavailable: 'Map unavailable',
  aMapUnavailableHint: 'Here are the addresses as a list, with their neighbourhood.',
  aNoCoords: 'No geolocated address yet',
  aAddresses: 'Addresses in Hammamet',

  bHeadline: 'What are you looking for today?',
  bSupport: 'An appointment, a good cake or a trusted craftsperson? It all starts here.',
  bTry: 'Try',
  bPrompts: [
    { label: 'A hairdresser near me', params: { category: 'beaute' } },
    { label: 'Order a cake', params: { mode: 'ORDER', q: 'gâteau' } },
    { label: 'Find a plumber', params: { category: 'depannage' } },
    { label: 'A garage in Hammamet', params: { category: 'automobile' } },
  ],
  bCategories: 'By category',
  bDiscover: 'Discover businesses near you',

  cMasthead: 'PupputGate · Hammamet',
  cHeadline: 'The best addresses in Hammamet.',
  cSupport: 'Meet the shops and professionals that keep your town alive.',
  cStory: 'Featured',
  cAddresses: 'The best addresses',
  cDaily: 'Everyday services',
  cShops: 'Shops to discover',
  cRead: 'Read the listing',

  dHeadline: 'The right service. The right shop. At the right time.',
  dSupport: 'Book, order or find a professional in Hammamet.',
  dBook: 'Book',
  dBookDesc: 'Pick a service and an available time slot.',
  dOrder: 'Order',
  dOrderDesc: 'Discover products from local shops and bakeries.',
  dPro: 'Find a pro',
  dProDesc: 'Describe what you need and get a quote from a professional.',
  dBusinesses: 'Shops to discover',
  dCategories: 'Popular categories',

  eHeadline: 'Hammamet has its best addresses. Find yours.',
  eSupport: 'Explore local shops, book your services and order close to home.',
  eDiscover: 'Discover',
  eShops: 'Shops',
  eServices: 'Services',
};

const ar: HomeCopy = {
  nearby: 'قريب منك',
  mapTitle: 'الحمامات، حيّا بحيّ',
  mapHint: 'المحلات والمهنيون المسجّلون، في عناوينهم.',
  seeProfile: 'عرض البطاقة',
  proTitle: 'هل أنت مهني؟',
  proBody:
    'اعرض نشاطك، استقبل الطلبات وأدر الحجوزات والطلبات وعروض الأسعار من مساحة واحدة.',
  proCta: 'انضم إلى PupputGate',
  emptyTitle: 'لا توجد محلات منشورة حالياً',
  emptyBody: 'ستظهر المحلات هنا بعد الموافقة عليها. هل أنت مهني؟ أنشئ بطاقتك الآن.',
  emptyProCta: 'إنشاء بطاقتي',
  langLabel: 'اللغة',

  aHeadline: 'كل ما تحتاجه، قريب منك.',
  aSupport: 'محلات وحرفيون وخدمات في الحمامات. اعثر على المهني المناسب في بضع نقرات.',
  aExplore: 'استكشف العناوين',
  aServices: 'اكتشف الخدمات',
  aMap: 'الخريطة',
  aList: 'القائمة',
  aAll: 'الكل',
  aMapUnavailable: 'الخريطة غير متاحة',
  aMapUnavailableHint: 'هذه العناوين في قائمة مع أحيائها.',
  aNoCoords: 'لا يوجد عنوان محدد على الخريطة',
  aAddresses: 'عناوين في الحمامات',

  bHeadline: 'عمّ تبحث اليوم؟',
  bSupport: 'موعد، كعكة لذيذة أو حرفي موثوق؟ كل شيء يبدأ هنا.',
  bTry: 'جرّب',
  bPrompts: [
    { label: 'حلاق قريب مني', params: { category: 'beaute' } },
    { label: 'اطلب كعكة', params: { mode: 'ORDER', q: 'gâteau' } },
    { label: 'ابحث عن سبّاك', params: { category: 'depannage' } },
    { label: 'مرآب في الحمامات', params: { category: 'automobile' } },
  ],
  bCategories: 'حسب الفئة',
  bDiscover: 'اكتشف قريباً منك',

  cMasthead: 'PupputGate · الحمامات',
  cHeadline: 'أفضل عناوين الحمامات.',
  cSupport: 'تعرّف على المحلات والمهنيين الذين ينشّطون مدينتك.',
  cStory: 'في الواجهة',
  cAddresses: 'أفضل العناوين',
  cDaily: 'خدمات يومية',
  cShops: 'محلات تستحق الاكتشاف',
  cRead: 'اقرأ البطاقة',

  dHeadline: 'الخدمة المناسبة. المحل المناسب. في الوقت المناسب.',
  dSupport: 'احجز، اطلب أو اعثر على مهني في الحمامات.',
  dBook: 'احجز',
  dBookDesc: 'اختر خدمة وموعداً متاحاً.',
  dOrder: 'اطلب',
  dOrderDesc: 'اكتشف منتجات المحلات والمخابز المحلية.',
  dPro: 'اعثر على مهني',
  dProDesc: 'صف حاجتك واحصل على عرض سعر من مهني.',
  dBusinesses: 'محلات تستحق الاكتشاف',
  dCategories: 'فئات مطلوبة',

  eHeadline: 'للحمامات عناوينها المميزة. اعثر على عناوينك.',
  eSupport: 'استكشف المحلات المحلية، احجز خدماتك واطلب قريباً منك.',
  eDiscover: 'اكتشف',
  eShops: 'محلات',
  eServices: 'خدمات',
};

export const HOME_COPY: Record<Locale, HomeCopy> = { fr, en, ar };

export function useHomeCopy(): HomeCopy {
  const { locale } = useLocale();
  return HOME_COPY[locale] ?? HOME_COPY.fr;
}
