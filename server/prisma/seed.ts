/**
 * Deterministic, reseedable demo data for PupputGate.
 * All businesses/transactions here are clearly SAMPLE data (isDemo = true).
 * Run with: npm run seed
 */
import { PrismaClient, type CommerceMode, type StockStatus, type BusinessStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'PupputDemo2026!';

const CATEGORIES = [
  { slug: 'beaute', nameFr: 'Beauté & Bien-être', nameEn: 'Beauty & Wellness', nameAr: 'الجمال والعافية', icon: 'sparkles-outline', sortOrder: 1 },
  { slug: 'automobile', nameFr: 'Automobile', nameEn: 'Automotive', nameAr: 'السيارات', icon: 'car-sport-outline', sortOrder: 2 },
  { slug: 'depannage', nameFr: 'Services à domicile & Dépannage', nameEn: 'Home Services & Repairs', nameAr: 'خدمات منزلية وإصلاح', icon: 'construct-outline', sortOrder: 3 },
  { slug: 'gastronomie', nameFr: 'Gastronomie & Pâtisserie', nameEn: 'Food & Pastry', nameAr: 'المأكولات والحلويات', icon: 'restaurant-outline', sortOrder: 4 },
  { slug: 'commerces', nameFr: 'Commerces & Boutiques locales', nameEn: 'Local Shops', nameAr: 'المتاجر المحلية', icon: 'storefront-outline', sortOrder: 5 },
  { slug: 'education', nameFr: 'Éducation & Formation', nameEn: 'Education & Training', nameAr: 'التعليم والتكوين', icon: 'school-outline', sortOrder: 6 },
  { slug: 'photographie', nameFr: 'Photographie & Création', nameEn: 'Photography & Creation', nameAr: 'التصوير والإبداع', icon: 'camera-outline', sortOrder: 7 },
  { slug: 'tourisme', nameFr: 'Tourisme & Loisirs', nameEn: 'Tourism & Leisure', nameAr: 'السياحة والترفيه', icon: 'boat-outline', sortOrder: 8 },
  { slug: 'evenementiel', nameFr: 'Événementiel', nameEn: 'Events', nameAr: 'تنظيم المناسبات', icon: 'balloon-outline', sortOrder: 9 },
  { slug: 'services-pro', nameFr: 'Services Professionnels', nameEn: 'Professional Services', nameAr: 'الخدمات المهنية', icon: 'briefcase-outline', sortOrder: 10 },
  { slug: 'artisanat', nameFr: 'Artisanat de la Médina', nameEn: 'Medina Craft', nameAr: 'حرف المدينة', icon: 'color-palette-outline', sortOrder: 11 },
  { slug: 'artisans', nameFr: 'Artisans & Métiers', nameEn: 'Artisans & Trades', nameAr: 'الحرفيون والمهن', icon: 'hammer-outline', sortOrder: 12 },
  { slug: 'petits-commerces', nameFr: 'Petits commerces & Épiceries', nameEn: 'Small Shops & Groceries', nameAr: 'المتاجر الصغيرة والبقالة', icon: 'basket-outline', sortOrder: 13 },
];

// Five Hammamet zones (documented in README). Coordinates are approximate and
// were checked against map tiles to sit on land: each centre has no water
// within ~440 m, and the per-shop spread below stays well inside that margin.
const ZONES = [
  { slug: 'medina', name: 'Médina', latitude: 36.4040, longitude: 10.6120 },
  { slug: 'centre', name: 'Centre-ville', latitude: 36.4085, longitude: 10.6000 },
  { slug: 'yasmine', name: 'Yasmine Hammamet', latitude: 36.3715, longitude: 10.5300 },
  { slug: 'nord', name: 'Hammamet Nord', latitude: 36.4260, longitude: 10.6000 },
  { slug: 'sud', name: 'Hammamet Sud', latitude: 36.3620, longitude: 10.5160 },
];

/** Max random spread (degrees) of a shop around its zone centre (~270 m). */
const SPREAD = 0.005;

const WEEK_MON_SAT = (open: number, close: number) =>
  Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    openMinute: weekday === 0 ? null : open,
    closeMinute: weekday === 0 ? null : close,
  }));

interface SeedBusiness {
  slug: string;
  name: string;
  ownerEmail: string;
  categorySlug: string;
  zoneSlug: string;
  primaryMode: CommerceMode;
  modes: CommerceMode[];
  status?: BusinessStatus;
  shortDescription: string;
  description: string;
  phone?: string;
  address?: string;
  serviceArea?: string;
  hideExactLocation?: boolean;
  capacityPerSlot?: number;
  latOffset?: number;
  lngOffset?: number;
  hours?: { weekday: number; openMinute: number | null; closeMinute: number | null }[];
  rating?: { avg: number; count: number };
  services?: { name: string; description?: string; durationMin: number; priceMillimes: number }[];
  products?: { name: string; description?: string; priceMillimes: number; stockStatus: StockStatus; stockQty?: number | null }[];
}

const BUSINESSES: SeedBusiness[] = [
  {
    slug: 'atelier-barber',
    name: 'Atelier Barber',
    ownerEmail: 'merchant@pupputgate.demo',
    categorySlug: 'beaute',
    zoneSlug: 'medina',
    primaryMode: 'APPOINTMENT',
    modes: ['APPOINTMENT'],
    shortDescription: 'Barbier traditionnel au cœur de la Médina.',
    description: 'Coupe homme, barbe et rasage traditionnel. Prise de rendez-vous rapide, paiement sur place.',
    phone: '+21672280100',
    address: '12 Rue de la Kasbah, Médina',
    capacityPerSlot: 1,
    rating: { avg: 4.7, count: 38 },
    hours: WEEK_MON_SAT(9 * 60, 19 * 60),
    services: [
      { name: 'Coupe Homme Classique', description: 'Coupe aux ciseaux et tondeuse.', durationMin: 30, priceMillimes: 15000 },
      { name: 'Coupe + Barbe', description: 'Coupe complète avec taille de barbe.', durationMin: 45, priceMillimes: 25000 },
      { name: 'Rasage traditionnel', description: 'Rasage au coupe-chou, serviette chaude.', durationMin: 20, priceMillimes: 12000 },
    ],
  },
  {
    slug: 'maison-du-7lou-arbi',
    name: 'Maison du 7lou Arbi',
    ownerEmail: 'pastry@pupputgate.demo',
    categorySlug: 'gastronomie',
    zoneSlug: 'centre',
    primaryMode: 'ORDER',
    modes: ['ORDER'],
    shortDescription: 'Pâtisserie tunisienne artisanale, retrait sur place.',
    description: 'Gâteaux sur commande et pâtisseries traditionnelles. Commandez en ligne, récupérez en boutique.',
    phone: '+21672280200',
    address: '45 Avenue de la République, Centre-ville',
    rating: { avg: 4.8, count: 52 },
    hours: WEEK_MON_SAT(8 * 60, 19 * 60),
    products: [
      { name: "Gâteau d'anniversaire", description: 'Sur commande, 6–8 parts.', priceMillimes: 48000, stockStatus: 'MADE_TO_ORDER', stockQty: null },
      { name: 'Baklawa (boîte 500g)', priceMillimes: 22000, stockStatus: 'IN_STOCK', stockQty: 20 },
      { name: 'Kaak Warka (6 pièces)', priceMillimes: 18000, stockStatus: 'IN_STOCK', stockQty: 12 },
      { name: 'Samsa (assortiment)', priceMillimes: 15000, stockStatus: 'IN_STOCK', stockQty: 30 },
    ],
  },
  {
    slug: 'sos-plomberie',
    name: 'SOS Plomberie',
    ownerEmail: 'plumber@pupputgate.demo',
    categorySlug: 'depannage',
    zoneSlug: 'yasmine',
    primaryMode: 'QUOTE',
    modes: ['QUOTE'],
    shortDescription: 'Dépannage plomberie à domicile, devis rapide.',
    description: 'Fuites, chauffe-eau, sanitaires. Demandez un devis en décrivant votre problème. Intervention sur le Grand Hammamet.',
    phone: '+21672280300',
    serviceArea: 'Grand Hammamet',
    hideExactLocation: true,
    rating: { avg: 4.5, count: 21 },
    hours: WEEK_MON_SAT(8 * 60, 18 * 60),
  },
  {
    slug: 'dar-khadija',
    name: 'Dar Khadija',
    ownerEmail: 'artisan@pupputgate.demo',
    categorySlug: 'artisanat',
    zoneSlug: 'medina',
    primaryMode: 'SHOWCASE',
    modes: ['SHOWCASE'],
    shortDescription: 'Artisanat de la Médina, pièces uniques.',
    description: 'Tapis noués main, poterie de Nabeul, laiton ciselé. Réservez la pièce qui vous plaît et retirez-la en boutique.',
    phone: '+21672280400',
    address: '3 Souk El Blaghjia, Médina',
    rating: { avg: 4.9, count: 17 },
    hours: WEEK_MON_SAT(9 * 60, 18 * 60),
    products: [
      { name: 'Tapis berbère noué main (pièce unique)', description: "Pièce unique, nouée à la main, 1,2 × 0,8 m.", priceMillimes: 450000, stockStatus: 'UNIQUE_PIECE', stockQty: 1 },
      { name: 'Poterie de Nabeul (assiette décorée)', priceMillimes: 35000, stockStatus: 'IN_STOCK', stockQty: 8 },
      { name: 'Lampe en laiton ciselé', priceMillimes: 120000, stockStatus: 'IN_STOCK', stockQty: 3 },
      { name: 'Miroir en bois d’olivier', priceMillimes: 85000, stockStatus: 'MADE_TO_ORDER', stockQty: null },
    ],
  },
  {
    slug: 'spa-yasmine',
    name: 'Spa Yasmine Bien-être',
    ownerEmail: 'merchant@pupputgate.demo',
    categorySlug: 'beaute',
    zoneSlug: 'yasmine',
    primaryMode: 'APPOINTMENT',
    modes: ['APPOINTMENT'],
    shortDescription: 'Hammam, massages et soins du visage.',
    description: 'Centre de bien-être à Yasmine Hammamet. Réservation par créneau.',
    phone: '+21672280500',
    address: 'Zone touristique, Yasmine Hammamet',
    capacityPerSlot: 2,
    rating: { avg: 4.4, count: 29 },
    hours: WEEK_MON_SAT(10 * 60, 20 * 60),
    services: [
      { name: 'Massage relaxant 45 min', durationMin: 45, priceMillimes: 60000 },
      { name: 'Hammam traditionnel', durationMin: 60, priceMillimes: 35000 },
      { name: 'Soin du visage', durationMin: 40, priceMillimes: 45000 },
    ],
  },
  {
    slug: 'garage-el-amen',
    name: 'Garage El Amen',
    ownerEmail: 'merchant@pupputgate.demo',
    categorySlug: 'automobile',
    zoneSlug: 'nord',
    primaryMode: 'QUOTE',
    modes: ['QUOTE', 'APPOINTMENT'],
    shortDescription: 'Mécanique générale et diagnostic auto.',
    description: 'Révision, freins, diagnostic. Devis et rendez-vous atelier.',
    phone: '+21672280600',
    address: 'Route de Nabeul, Hammamet Nord',
    serviceArea: 'Hammamet Nord',
    rating: { avg: 4.3, count: 33 },
    hours: WEEK_MON_SAT(8 * 60, 17 * 60),
    services: [{ name: 'Diagnostic électronique', durationMin: 30, priceMillimes: 30000 }],
  },
  {
    slug: 'boulangerie-dar-el-khobz',
    name: 'Boulangerie Dar El Khobz',
    ownerEmail: 'pastry@pupputgate.demo',
    categorySlug: 'gastronomie',
    zoneSlug: 'sud',
    primaryMode: 'ORDER',
    modes: ['ORDER'],
    shortDescription: 'Pain frais et viennoiseries, retrait matinal.',
    description: 'Baguettes, pain maison et viennoiseries. Commandez la veille pour le lendemain.',
    phone: '+21672280700',
    address: 'Rue de la Gare, Hammamet Sud',
    rating: { avg: 4.6, count: 44 },
    hours: WEEK_MON_SAT(6 * 60, 14 * 60),
    products: [
      { name: 'Baguette tradition (x4)', priceMillimes: 2000, stockStatus: 'IN_STOCK', stockQty: 100 },
      { name: 'Croissants (x6)', priceMillimes: 9000, stockStatus: 'IN_STOCK', stockQty: 40 },
      { name: 'Pain de campagne', priceMillimes: 3500, stockStatus: 'MADE_TO_ORDER', stockQty: null },
    ],
  },
  {
    slug: 'boutique-lin-coton',
    name: 'Boutique Lin & Coton',
    ownerEmail: 'artisan@pupputgate.demo',
    categorySlug: 'commerces',
    zoneSlug: 'centre',
    primaryMode: 'SHOWCASE',
    modes: ['SHOWCASE', 'ORDER'],
    shortDescription: 'Linge de maison et vêtements en lin.',
    description: 'Textiles naturels fabriqués localement. Réservation et retrait en boutique.',
    phone: '+21672280800',
    address: 'Avenue Habib Bourguiba, Centre-ville',
    rating: { avg: 4.2, count: 12 },
    hours: WEEK_MON_SAT(9 * 60, 19 * 60),
    products: [
      { name: 'Nappe en lin brodée', priceMillimes: 65000, stockStatus: 'IN_STOCK', stockQty: 6 },
      { name: 'Chemise en lin (homme)', priceMillimes: 75000, stockStatus: 'IN_STOCK', stockQty: 10 },
      { name: 'Foutah tissée (pièce unique)', priceMillimes: 55000, stockStatus: 'UNIQUE_PIECE', stockQty: 1 },
    ],
  },
  {
    slug: 'epicerie-chez-sami',
    name: 'Épicerie Chez Sami',
    ownerEmail: 'pastry@pupputgate.demo',
    categorySlug: 'petits-commerces',
    zoneSlug: 'centre',
    primaryMode: 'ORDER',
    modes: ['ORDER'],
    shortDescription: 'L’épicerie du quartier : produits du terroir et de première nécessité.',
    description: 'Huile d’olive, épices, dattes et produits du quotidien. Commandez, passez récupérer.',
    phone: '+21672281100',
    address: 'Rue Ali Belhouane, Centre-ville',
    rating: { avg: 4.5, count: 31 },
    hours: WEEK_MON_SAT(7 * 60, 21 * 60),
    products: [
      { name: 'Huile d’olive vierge 1 L', priceMillimes: 18000, stockStatus: 'IN_STOCK', stockQty: 24 },
      { name: 'Harissa maison (pot)', priceMillimes: 3500, stockStatus: 'IN_STOCK', stockQty: 40 },
      { name: 'Dattes Deglet Nour 500 g', priceMillimes: 9000, stockStatus: 'IN_STOCK', stockQty: 18 },
    ],
  },
  {
    slug: 'primeur-du-marche',
    name: 'Primeur du Marché',
    ownerEmail: 'pastry@pupputgate.demo',
    categorySlug: 'petits-commerces',
    zoneSlug: 'nord',
    primaryMode: 'ORDER',
    modes: ['ORDER'],
    shortDescription: 'Fruits et légumes de saison, paniers à retirer.',
    description: 'Produits frais du marché local. Réservez votre panier de la semaine.',
    phone: '+21672281200',
    address: 'Marché central, Hammamet Nord',
    rating: { avg: 4.3, count: 19 },
    hours: WEEK_MON_SAT(6 * 60, 15 * 60),
    products: [
      { name: 'Panier de saison (5 kg)', priceMillimes: 15000, stockStatus: 'MADE_TO_ORDER', stockQty: null },
      { name: 'Oranges de Cap Bon (2 kg)', priceMillimes: 5000, stockStatus: 'IN_STOCK', stockQty: 60 },
    ],
  },
  {
    slug: 'menuiserie-ben-salah',
    name: 'Menuiserie Ben Salah',
    ownerEmail: 'artisan@pupputgate.demo',
    categorySlug: 'artisans',
    zoneSlug: 'sud',
    primaryMode: 'QUOTE',
    modes: ['QUOTE', 'APPOINTMENT'],
    shortDescription: 'Menuiserie sur mesure : portes, placards, cuisines.',
    description: 'Artisan menuisier depuis 20 ans. Visite sur place et devis gratuit.',
    phone: '+21672281300',
    serviceArea: 'Hammamet et environs',
    hideExactLocation: true,
    rating: { avg: 4.7, count: 26 },
    hours: WEEK_MON_SAT(8 * 60, 17 * 60),
    services: [{ name: 'Visite & devis', durationMin: 30, priceMillimes: 0 }],
  },
  {
    slug: 'couture-latifa',
    name: 'Couture Latifa',
    ownerEmail: 'artisan@pupputgate.demo',
    categorySlug: 'artisans',
    zoneSlug: 'medina',
    primaryMode: 'APPOINTMENT',
    modes: ['APPOINTMENT'],
    shortDescription: 'Retouches et couture sur mesure.',
    description: 'Ourlets, ajustements et créations sur mesure, avec essayage sur rendez-vous.',
    phone: '+21672281400',
    address: 'Ruelle des Artisans, Médina',
    rating: { avg: 4.8, count: 22 },
    hours: WEEK_MON_SAT(9 * 60, 17 * 60),
    services: [
      { name: 'Retouche (ourlet, fermeture)', durationMin: 30, priceMillimes: 8000 },
      { name: 'Essayage sur mesure', durationMin: 45, priceMillimes: 15000 },
    ],
  },
  {
    slug: 'centre-formation-pupput',
    name: 'Centre de Formation Pupput',
    ownerEmail: 'merchant@pupputgate.demo',
    categorySlug: 'education',
    zoneSlug: 'centre',
    primaryMode: 'APPOINTMENT',
    modes: ['APPOINTMENT', 'QUOTE'],
    shortDescription: 'Cours de langues et soutien scolaire.',
    description: 'Français, anglais, informatique. Prenez un rendez-vous d’évaluation.',
    phone: '+21672280900',
    address: 'Rue Ali Belhouane, Centre-ville',
    rating: { avg: 4.1, count: 9 },
    hours: WEEK_MON_SAT(9 * 60, 18 * 60),
    services: [{ name: "Séance d'évaluation", durationMin: 30, priceMillimes: 0 }],
  },
  {
    slug: 'studio-lumiere-photo',
    name: 'Studio Lumière Photo',
    ownerEmail: 'merchant@pupputgate.demo',
    categorySlug: 'photographie',
    zoneSlug: 'medina',
    primaryMode: 'APPOINTMENT',
    modes: ['APPOINTMENT', 'QUOTE'],
    shortDescription: 'Portraits, mariages et photos d’identité.',
    description: 'Studio et reportages. Réservez une séance ou demandez un devis événement.',
    phone: '+21672281000',
    address: 'Rue du Fort, Médina',
    rating: { avg: 4.8, count: 25 },
    hours: WEEK_MON_SAT(9 * 60, 18 * 60),
    services: [
      { name: "Photo d'identité", durationMin: 15, priceMillimes: 12000 },
      { name: 'Séance portrait studio', durationMin: 45, priceMillimes: 80000 },
    ],
  },
  {
    slug: 'hammamet-aventures',
    name: 'Hammamet Aventures',
    ownerEmail: 'merchant@pupputgate.demo',
    categorySlug: 'tourisme',
    zoneSlug: 'yasmine',
    primaryMode: 'ORDER',
    modes: ['ORDER', 'APPOINTMENT'],
    shortDescription: 'Excursions et activités nautiques.',
    description: 'Sorties en mer, quad, excursions. Réservez votre place.',
    phone: '+21672281100',
    address: 'Marina, Yasmine Hammamet',
    rating: { avg: 4.5, count: 40 },
    hours: WEEK_MON_SAT(8 * 60, 19 * 60),
    products: [
      { name: 'Sortie en mer (2h, par personne)', priceMillimes: 45000, stockStatus: 'IN_STOCK', stockQty: 24 },
      { name: 'Excursion quad (1h)', priceMillimes: 60000, stockStatus: 'IN_STOCK', stockQty: 12 },
    ],
  },
  {
    slug: 'evenements-jasmin',
    name: 'Événements Jasmin',
    ownerEmail: 'merchant@pupputgate.demo',
    categorySlug: 'evenementiel',
    zoneSlug: 'nord',
    primaryMode: 'QUOTE',
    modes: ['QUOTE'],
    shortDescription: 'Organisation de mariages et fêtes.',
    description: 'Décoration, traiteur, animation. Décrivez votre événement pour un devis.',
    phone: '+21672281200',
    serviceArea: 'Grand Hammamet',
    hideExactLocation: true,
    rating: { avg: 4.6, count: 14 },
    hours: WEEK_MON_SAT(9 * 60, 18 * 60),
  },
  {
    slug: 'cabinet-comptable-pro',
    name: 'Cabinet Comptable Pro',
    ownerEmail: 'merchant@pupputgate.demo',
    categorySlug: 'services-pro',
    zoneSlug: 'centre',
    primaryMode: 'APPOINTMENT',
    modes: ['APPOINTMENT', 'QUOTE'],
    shortDescription: 'Comptabilité et conseil aux TPE.',
    description: 'Tenue de comptes, déclarations, conseil. Prenez rendez-vous.',
    phone: '+21672281300',
    address: 'Immeuble Yasmine, Centre-ville',
    rating: { avg: 4.4, count: 11 },
    hours: WEEK_MON_SAT(9 * 60, 17 * 60),
    services: [{ name: 'Consultation initiale', durationMin: 30, priceMillimes: 40000 }],
  },
  {
    slug: 'ceramique-medina',
    name: 'Céramique Médina',
    ownerEmail: 'artisan@pupputgate.demo',
    categorySlug: 'artisanat',
    zoneSlug: 'medina',
    primaryMode: 'SHOWCASE',
    modes: ['SHOWCASE'],
    status: 'PENDING', // pending approval → visible in admin, not in public listings
    shortDescription: 'Céramique peinte à la main (en attente de validation).',
    description: 'Atelier de céramique de la Médina. Compte en attente de validation par l’administration.',
    phone: '+21672281400',
    address: 'Souk des potiers, Médina',
    hours: WEEK_MON_SAT(9 * 60, 18 * 60),
    products: [
      { name: 'Vase peint à la main (pièce unique)', priceMillimes: 95000, stockStatus: 'UNIQUE_PIECE', stockQty: 1 },
    ],
  },
];

async function reset() {
  // Delete in dependency order so reseeding is clean.
  await prisma.communicationLog.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favourite.deleteMany();
  await prisma.product.deleteMany();
  await prisma.service.deleteMany();
  await prisma.scheduleException.deleteMany();
  await prisma.openingHour.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.business.deleteMany();
  await prisma.session.deleteMany();
  await prisma.category.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await reset();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const users = [
    { email: 'client@pupputgate.demo', fullName: 'Client Démo', role: 'CUSTOMER' as const, phone: '+21620111111' },
    { email: 'merchant@pupputgate.demo', fullName: 'Commerçant Démo', role: 'MERCHANT' as const, phone: '+21620222222' },
    { email: 'pastry@pupputgate.demo', fullName: 'Pâtisserie Démo', role: 'MERCHANT' as const, phone: '+21620333333' },
    { email: 'plumber@pupputgate.demo', fullName: 'Plombier Démo', role: 'MERCHANT' as const, phone: '+21620444444' },
    { email: 'artisan@pupputgate.demo', fullName: 'Artisan Démo', role: 'MERCHANT' as const, phone: '+21620555555' },
    { email: 'admin@pupputgate.demo', fullName: 'Admin Démo', role: 'ADMIN' as const, phone: '+21620666666' },
  ];
  const userByEmail = new Map<string, string>();
  for (const u of users) {
    const created = await prisma.user.create({
      data: { email: u.email, fullName: u.fullName, role: u.role, phone: u.phone, passwordHash, locale: 'fr' },
    });
    userByEmail.set(u.email, created.id);
  }

  const catBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const created = await prisma.category.create({ data: c });
    catBySlug.set(c.slug, created.id);
  }
  const zoneBySlug = new Map<string, { id: string; lat: number; lng: number }>();
  for (const z of ZONES) {
    const created = await prisma.zone.create({ data: z });
    zoneBySlug.set(z.slug, { id: created.id, lat: z.latitude, lng: z.longitude });
  }

  const bizIdBySlug = new Map<string, string>();
  for (const b of BUSINESSES) {
    const zone = zoneBySlug.get(b.zoneSlug)!;
    const created = await prisma.business.create({
      data: {
        slug: b.slug,
        name: b.name,
        categoryId: catBySlug.get(b.categorySlug)!,
        zoneId: zone.id,
        primaryMode: b.primaryMode,
        modes: b.modes,
        status: b.status ?? 'APPROVED',
        shortDescription: b.shortDescription,
        description: b.description,
        phone: b.phone ?? null,
        address: b.address ?? null,
        serviceArea: b.serviceArea ?? null,
        hideExactLocation: b.hideExactLocation ?? false,
        capacityPerSlot: b.capacityPerSlot ?? 1,
        latitude: zone.lat + (b.latOffset ?? (Math.random() - 0.5) * SPREAD),
        longitude: zone.lng + (b.lngOffset ?? (Math.random() - 0.5) * SPREAD),
        ratingAvg: b.rating?.avg ?? null,
        ratingCount: b.rating?.count ?? 0,
        isDemo: true,
        openingHours: { create: b.hours ?? WEEK_MON_SAT(9 * 60, 18 * 60) },
        services: b.services ? { create: b.services.map((s, i) => ({ ...s, sortOrder: i })) } : undefined,
        products: b.products
          ? { create: b.products.map((p, i) => ({ ...p, stockQty: p.stockStatus === 'UNIQUE_PIECE' ? 1 : p.stockQty ?? null, sortOrder: i })) }
          : undefined,
      },
    });
    bizIdBySlug.set(b.slug, created.id);
    await prisma.membership.create({
      data: { userId: userByEmail.get(b.ownerEmail)!, businessId: created.id, isOwner: true },
    });

    // Seed a couple of demo reviews for businesses with a rating.
    if (b.rating) {
      await prisma.review.createMany({
        data: [
          { businessId: created.id, authorId: userByEmail.get('client@pupputgate.demo')!, rating: Math.min(5, Math.round(b.rating.avg)), comment: 'Service impeccable, je recommande. (avis de démonstration)', isDemo: true },
          { businessId: created.id, authorId: userByEmail.get('client@pupputgate.demo')!, rating: Math.max(3, Math.round(b.rating.avg) - 1), comment: 'Très bon accueil. (avis de démonstration)', isDemo: true },
        ],
      });
    }
  }

  // A closed schedule exception for the barber next Sunday-after (demo of exceptions).
  const barberId = bizIdBySlug.get('atelier-barber')!;
  const exceptionDate = new Date();
  exceptionDate.setUTCHours(0, 0, 0, 0);
  exceptionDate.setUTCDate(exceptionDate.getUTCDate() + 3);
  await prisma.scheduleException.create({
    data: { businessId: barberId, date: exceptionDate, closed: true, reason: 'Jour férié (démonstration)' },
  });

  // Demo activity so the professional screens are not empty: a few bookings
  // today, orders to prepare and a quote request. All clearly demo data.
  const clientId = userByEmail.get('client@pupputgate.demo')!;
  const todayAt = (hh: number, mm: number) => {
    const d = new Date();
    d.setUTCHours(hh, mm, 0, 0);
    return d;
  };
  const barberServices = await prisma.service.findMany({ where: { businessId: barberId }, orderBy: { sortOrder: 'asc' } });
  const slotsToday = [
    { at: todayAt(14, 0), status: 'CONFIRMED' as const, note: 'Dégradé + barbe (démo)' },
    { at: todayAt(15, 30), status: 'PENDING' as const, note: 'Première visite (démo)' },
    { at: todayAt(16, 30), status: 'PENDING' as const, note: null },
  ];
  for (const [i, s] of slotsToday.entries()) {
    const svc = barberServices[i % Math.max(1, barberServices.length)];
    if (!svc) break;
    await prisma.appointment.create({
      data: {
        businessId: barberId,
        customerId: clientId,
        serviceId: svc.id,
        startAt: s.at,
        endAt: new Date(s.at.getTime() + svc.durationMin * 60_000),
        durationMin: svc.durationMin,
        priceMillimes: svc.priceMillimes,
        status: s.status,
        note: s.note,
      },
    });
  }

  const bakeryId = bizIdBySlug.get('boulangerie-dar-el-khobz');
  if (bakeryId) {
    const prods = await prisma.product.findMany({ where: { businessId: bakeryId }, orderBy: { sortOrder: 'asc' }, take: 2 });
    const orderStatuses = ['PENDING', 'CONFIRMED'] as const;
    for (const [i, status] of orderStatuses.entries()) {
      const items = prods.slice(0, i + 1).map((p) => ({ p, quantity: 2 + i }));
      if (items.length === 0) break;
      await prisma.order.create({
        data: {
          businessId: bakeryId,
          customerId: clientId,
          status,
          totalMillimes: items.reduce((sum, it) => sum + it.p.priceMillimes * it.quantity, 0),
          pickupAt: todayAt(17 + i, 0),
          items: {
            create: items.map((it) => ({
              productId: it.p.id,
              productName: it.p.name,
              quantity: it.quantity,
              unitPriceMillimes: it.p.priceMillimes,
            })),
          },
        },
      });
    }
  }

  const plumberId = bizIdBySlug.get('sos-plomberie');
  if (plumberId) {
    await prisma.serviceRequest.create({
      data: {
        businessId: plumberId,
        customerId: clientId,
        problemType: 'Fuite sous l’évier',
        description: 'Fuite au niveau du siphon de la cuisine, de l’eau au sol. Intervention rapide si possible. (démo)',
        zoneSlug: 'centre',
        address: 'Rue de la Corniche, Hammamet (adresse de démonstration)',
        timeWindow: 'Aujourd’hui, après 16h',
        urgent: true,
        photoUrls: [],
      },
    });
  }

  // A simulated communication-log entry so the merchant screen isn't empty.
  await prisma.communicationLog.create({
    data: {
      businessId: barberId,
      recipient: '+21620111111',
      body: 'PupputGate (simulation) : rappel de rendez-vous demain à 10:00.',
      channel: 'SMS_SIMULATED',
      simulated: true,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Seeded ${users.length} users, ${CATEGORIES.length} categories, ${ZONES.length} zones, ${BUSINESSES.length} businesses.`);
  // eslint-disable-next-line no-console
  console.log(`Demo password for all accounts: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
