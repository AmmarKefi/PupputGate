import type { BusinessSummary, Category, CommerceMode, Zone } from '@/types';

/** Everything a concept needs, loaded once by the dispatcher. */
export interface HomeData {
  businesses: BusinessSummary[];
  categories: Category[];
  zones: Zone[];
  categoryName: (c: Category) => string;
  byMode: (mode: CommerceMode) => BusinessSummary[];
  withCoords: BusinessSummary[];
}

/** Props every concept receives. Data and locale come from the dispatcher. */
export interface HomeConceptProps {
  /** A guest must still find sign-in and the professional entry point. */
  guest: boolean;
  data: HomeData;
}

export type ConceptId = 'A' | 'B' | 'C' | 'D' | 'E';

export interface ConceptMeta {
  id: ConceptId;
  name: string;
  tagline: string;
  /** One-line summary of the direction, shown in the preview switcher. */
  note: string;
}

/** Internal design-preview metadata (not customer-facing copy). */
export const CONCEPTS: ConceptMeta[] = [
  {
    id: 'A',
    name: 'La carte locale',
    tagline: 'Hammamet au centre',
    note: 'Carte interactive réelle + rail synchronisé. Différenciant local, plus lourd à charger.',
  },
  {
    id: 'B',
    name: 'Une recherche, tous les besoins',
    tagline: 'La recherche d’abord',
    note: 'Champ de recherche dominant, suggestions réelles, catégories illustrées.',
  },
  {
    id: 'C',
    name: 'Le magazine local',
    tagline: 'Éditorial',
    note: 'Mise en page magazine, hiérarchie typographique forte, découverte avant tout.',
  },
  {
    id: 'D',
    name: 'Trois façons d’agir',
    tagline: 'Le modèle en 3 gestes',
    note: 'Réserver / Commander / Trouver un pro. Compréhension immédiate du produit.',
  },
  {
    id: 'E',
    name: 'La place de marché premium',
    tagline: 'Premium, sobre',
    note: 'Grille régulière, typographie soignée, sections Commerces et Services.',
  },
];

/** Concept used for the real homepage. Change this one line to switch. */
export const PRODUCTION_CONCEPT: ConceptId = 'D';
