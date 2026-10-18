/* Maps Prisma records to the API DTO shapes the mobile app consumes. */
/* eslint-disable @typescript-eslint/no-explicit-any */

export function serializeUser(u: any) {
  return {
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    phone: u.phone ?? null,
    role: u.role,
    locale: u.locale,
    suspended: u.suspended,
  };
}

export function serializeBusinessSummary(
  b: any,
  opts: { favouriteIds?: Set<string>; distanceKm?: number | null; nextSlotLabel?: string | null } = {},
) {
  // Public listings never expose an exact pin when the merchant hid it.
  const exposeLoc = !b.hideExactLocation;
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    categorySlug: b.category?.slug ?? b.categorySlug,
    primaryMode: b.primaryMode,
    modes: b.modes,
    zoneSlug: b.zone?.slug ?? b.zoneSlug,
    zoneName: b.zone?.name ?? '',
    coverImage: b.coverImage ?? null,
    ratingAvg: b.ratingAvg ?? null,
    ratingCount: b.ratingCount ?? 0,
    status: b.status,
    latitude: exposeLoc ? b.latitude ?? null : null,
    longitude: exposeLoc ? b.longitude ?? null : null,
    hideExactLocation: b.hideExactLocation,
    acceptingBookings: b.acceptingBookings,
    shortDescription: b.shortDescription ?? null,
    priceFromMillimes: priceFrom(b),
    nextSlotLabel: opts.nextSlotLabel ?? null,
    distanceKm: opts.distanceKm ?? null,
    isFavourite: opts.favouriteIds ? opts.favouriteIds.has(b.id) : undefined,
  };
}

function priceFrom(b: any): number | null {
  const prices: number[] = [];
  if (Array.isArray(b.services)) prices.push(...b.services.map((s: any) => s.priceMillimes));
  if (Array.isArray(b.products)) prices.push(...b.products.map((p: any) => p.priceMillimes));
  return prices.length ? Math.min(...prices) : null;
}

export function serializeBusinessDetail(
  b: any,
  opts: { favouriteIds?: Set<string>; nextSlotLabel?: string | null } = {},
) {
  const exposeLoc = !b.hideExactLocation;
  return {
    ...serializeBusinessSummary(b, opts),
    description: b.description ?? null,
    phone: b.phone ?? null,
    address: exposeLoc ? b.address ?? null : null,
    serviceArea: b.serviceArea ?? null,
    capacityPerSlot: b.capacityPerSlot,
    photos: (b.photos ?? []).map((p: any) => ({ id: p.id, url: p.url })),
    openingHours: (b.openingHours ?? []).map((h: any) => ({
      weekday: h.weekday,
      openMinute: h.openMinute,
      closeMinute: h.closeMinute,
    })),
    services: (b.services ?? [])
      .filter((s: any) => s.active)
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description ?? null,
        durationMin: s.durationMin,
        priceMillimes: s.priceMillimes,
      })),
    products: (b.products ?? [])
      .filter((p: any) => p.active)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description ?? null,
        priceMillimes: p.priceMillimes,
        stockStatus: p.stockStatus,
        stockQty: p.stockQty ?? null,
        image: p.image ?? null,
        isUnique: p.stockStatus === 'UNIQUE_PIECE',
      })),
  };
}

export function serializeAppointment(a: any) {
  return {
    id: a.id,
    businessId: a.businessId,
    businessName: a.business?.name ?? '',
    serviceName: a.service?.name ?? '',
    startIso: a.startAt.toISOString(),
    durationMin: a.durationMin,
    priceMillimes: a.priceMillimes,
    status: a.status,
    note: a.note ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

export function serializeOrder(o: any) {
  return {
    id: o.id,
    businessId: o.businessId,
    businessName: o.business?.name ?? '',
    lines: (o.items ?? []).map((it: any) => ({
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      unitPriceMillimes: it.unitPriceMillimes,
    })),
    totalMillimes: o.totalMillimes,
    pickupIso: o.pickupAt ? o.pickupAt.toISOString() : null,
    note: o.note ?? null,
    status: o.status,
    createdAt: o.createdAt.toISOString(),
  };
}

/**
 * Service requests carry a PRIVATE address. `canSeePrivate` must be true only
 * for the owning customer, the assigned merchant, or an admin.
 */
export function serializeServiceRequest(r: any, canSeePrivate: boolean) {
  return {
    id: r.id,
    businessId: r.businessId,
    businessName: r.business?.name ?? '',
    problemType: r.problemType,
    description: r.description,
    zoneSlug: r.zoneSlug,
    address: canSeePrivate ? r.address ?? null : null,
    timeWindow: r.timeWindow ?? null,
    urgent: r.urgent,
    photoUrls: r.photoUrls ?? [],
    status: r.status,
    quotation: r.quotation
      ? {
          amountMillimes: r.quotation.amountMillimes,
          advanceMillimes: r.quotation.advanceMillimes ?? null,
          scope: r.quotation.scope ?? null,
          validUntilIso: r.quotation.validUntil
            ? r.quotation.validUntil.toISOString()
            : null,
          createdAt: r.quotation.createdAt.toISOString(),
        }
      : null,
    createdAt: r.createdAt.toISOString(),
  };
}
