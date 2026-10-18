/** Shared mobile-side types mirroring the server API contracts. */

export type Role = 'CUSTOMER' | 'MERCHANT' | 'ADMIN';

export type CommerceMode = 'APPOINTMENT' | 'ORDER' | 'SHOWCASE' | 'QUOTE';

export type BusinessStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export type StockStatus =
  | 'IN_STOCK'
  | 'UNIQUE_PIECE'
  | 'MADE_TO_ORDER'
  | 'OUT_OF_STOCK';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export type ServiceRequestStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'QUOTE_SENT'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DECLINED'
  | 'CANCELLED';

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: Role;
  locale: string;
  suspended: boolean;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: PublicUser;
}

export interface Category {
  id: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  nameAr: string;
  icon: string; // Ionicons name
}

export interface Zone {
  id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface BusinessSummary {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  primaryMode: CommerceMode;
  modes: CommerceMode[];
  zoneSlug: string;
  zoneName: string;
  coverImage: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  status: BusinessStatus;
  latitude: number | null;
  longitude: number | null;
  hideExactLocation: boolean;
  acceptingBookings: boolean;
  shortDescription: string | null;
  priceFromMillimes: number | null;
  nextSlotLabel: string | null;
  distanceKm?: number | null;
  isFavourite?: boolean;
}

export interface OpeningHour {
  weekday: number; // 0 = Sunday
  openMinute: number | null; // minutes from midnight, null = closed
  closeMinute: number | null;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string | null;
  durationMin: number;
  priceMillimes: number;
}

export interface ProductItem {
  id: string;
  name: string;
  description: string | null;
  priceMillimes: number;
  stockStatus: StockStatus;
  stockQty: number | null;
  image: string | null;
  isUnique: boolean;
}

export interface BusinessDetail extends BusinessSummary {
  description: string | null;
  phone: string | null;
  address: string | null;
  serviceArea: string | null;
  capacityPerSlot: number;
  /** Gallery photos (urls are `/uploads/...` paths; use `assetUrl`). */
  photos?: { id: string; url: string }[];
  openingHours: OpeningHour[];
  services: ServiceItem[];
  products: ProductItem[];
}

export interface Slot {
  startIso: string;
  label: string;
  available: boolean;
}

export interface Appointment {
  id: string;
  businessId: string;
  businessName: string;
  serviceName: string;
  startIso: string;
  durationMin: number;
  priceMillimes: number;
  status: AppointmentStatus;
  note: string | null;
  createdAt: string;
}

export interface OrderLine {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceMillimes: number;
}

export interface Order {
  id: string;
  businessId: string;
  businessName: string;
  lines: OrderLine[];
  totalMillimes: number;
  pickupIso: string | null;
  note: string | null;
  status: OrderStatus;
  createdAt: string;
}

export interface Quotation {
  amountMillimes: number;
  advanceMillimes: number | null;
  scope: string | null;
  validUntilIso: string | null;
  createdAt: string;
}

export interface ServiceRequest {
  id: string;
  businessId: string;
  businessName: string;
  problemType: string;
  description: string;
  zoneSlug: string;
  address: string | null; // private; only returned to authorised parties
  timeWindow: string | null;
  urgent: boolean;
  photoUrls: string[];
  status: ServiceRequestStatus;
  quotation: Quotation | null;
  createdAt: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}
