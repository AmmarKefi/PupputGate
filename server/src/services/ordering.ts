import { prisma } from '../prisma';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors';
import { withSerializationRetry } from './retry';

export interface OrderInputLine {
  productId: string;
  quantity: number;
}
export interface CreateOrderInput {
  customerId: string;
  businessId: string;
  lines: OrderInputLine[];
  pickupIso?: string | null;
  note?: string | null;
}

// Order statuses that still "hold" a reservation.
const ACTIVE_ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
] as const;

/**
 * Create an order with transactional stock enforcement:
 *  - OUT_OF_STOCK: rejected.
 *  - UNIQUE_PIECE: qty must be 1 and no other active order may hold it.
 *  - IN_STOCK: qty <= stockQty; stock decremented atomically.
 *  - MADE_TO_ORDER: allowed, no stock decrement.
 */
export async function createOrder(input: CreateOrderInput) {
  if (!input.lines.length) throw badRequest('Panier vide');
  const pickupAt = input.pickupIso ? new Date(input.pickupIso) : null;
  if (pickupAt && Number.isNaN(pickupAt.getTime()))
    throw badRequest('Date de retrait invalide');
  if (pickupAt && pickupAt.getTime() <= Date.now())
    throw badRequest('La date de retrait doit être dans le futur');

  return withSerializationRetry(() =>
    prisma.$transaction(
      async (tx) => {
        const business = await tx.business.findUnique({ where: { id: input.businessId } });
        if (!business) throw notFound('Commerce introuvable');
        if (business.status !== 'APPROVED')
          throw forbidden("Ce commerce n'est pas disponible");
        if (!business.modes.includes('ORDER') && !business.modes.includes('SHOWCASE'))
          throw badRequest('Ce commerce ne prend pas de commandes');

        let total = 0;
        const itemsData: {
          productId: string;
          productName: string;
          quantity: number;
          unitPriceMillimes: number;
        }[] = [];

        for (const line of input.lines) {
          if (!Number.isInteger(line.quantity) || line.quantity < 1)
            throw badRequest('Quantité invalide');

          const product = await tx.product.findFirst({
            where: { id: line.productId, businessId: business.id, active: true },
          });
          if (!product) throw notFound('Produit introuvable');

          switch (product.stockStatus) {
            case 'OUT_OF_STOCK':
              throw conflict(`"${product.name}" est épuisé`, 'OUT_OF_STOCK');
            case 'UNIQUE_PIECE': {
              if (line.quantity !== 1)
                throw badRequest('Une pièce unique ne peut être réservée qu’en 1 exemplaire');
              const held = await tx.orderItem.count({
                where: {
                  productId: product.id,
                  order: { status: { in: [...ACTIVE_ORDER_STATUSES] } },
                },
              });
              if (held > 0)
                throw conflict('Cette pièce unique est déjà réservée', 'UNIQUE_TAKEN');
              break;
            }
            case 'IN_STOCK': {
              const available = product.stockQty ?? 0;
              if (line.quantity > available)
                throw conflict(
                  `Stock insuffisant pour "${product.name}" (reste ${available})`,
                  'INSUFFICIENT_STOCK',
                );
              await tx.product.update({
                where: { id: product.id },
                data: { stockQty: available - line.quantity },
              });
              break;
            }
            case 'MADE_TO_ORDER':
              break;
          }

          total += product.priceMillimes * line.quantity;
          itemsData.push({
            productId: product.id,
            productName: product.name,
            quantity: line.quantity,
            unitPriceMillimes: product.priceMillimes,
          });
        }

        return tx.order.create({
          data: {
            businessId: business.id,
            customerId: input.customerId,
            totalMillimes: total,
            pickupAt,
            note: input.note ?? null,
            status: 'PENDING',
            items: { create: itemsData },
          },
          include: { items: true, business: true },
        });
      },
      { isolationLevel: 'Serializable' },
    ),
  );
}

/** Restore stock when an order is cancelled/rejected before fulfilment. */
export async function restoreStockForOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });
    if (!order) return;
    for (const item of order.items) {
      if (item.product.stockStatus === 'IN_STOCK') {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: (item.product.stockQty ?? 0) + item.quantity },
        });
      }
    }
  });
}
