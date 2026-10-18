import { prisma } from '../prisma';
import { badRequest, conflict, forbidden, notFound } from '../lib/errors';
import { assertRequestTransition } from './transitions';

async function assertMerchantOwnsRequestBusiness(userId: string, requestId: string) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: { business: { include: { memberships: true } } },
  });
  if (!request) throw notFound('Demande introuvable');
  const owns = request.business.memberships.some((m) => m.userId === userId);
  if (!owns) throw forbidden();
  return request;
}

export interface QuotationInput {
  amountMillimes: number;
  advanceMillimes?: number | null;
  scope?: string | null;
  validUntilIso?: string | null;
}

/** Merchant submits (or updates) a quotation; request moves to QUOTE_SENT. */
export async function submitQuotation(
  merchantUserId: string,
  requestId: string,
  input: QuotationInput,
) {
  if (!Number.isInteger(input.amountMillimes) || input.amountMillimes <= 0)
    throw badRequest('Montant invalide');
  if (
    input.advanceMillimes != null &&
    (!Number.isInteger(input.advanceMillimes) ||
      input.advanceMillimes < 0 ||
      input.advanceMillimes > input.amountMillimes)
  )
    throw badRequest('Avance invalide');

  const request = await assertMerchantOwnsRequestBusiness(merchantUserId, requestId);
  if (!['SUBMITTED', 'UNDER_REVIEW', 'QUOTE_SENT'].includes(request.status))
    throw conflict('Cette demande ne peut plus recevoir de devis', 'BAD_TRANSITION');

  const validUntil = input.validUntilIso ? new Date(input.validUntilIso) : null;

  return prisma.$transaction(async (tx) => {
    await tx.quotation.upsert({
      where: { requestId },
      create: {
        requestId,
        amountMillimes: input.amountMillimes,
        advanceMillimes: input.advanceMillimes ?? null,
        scope: input.scope ?? null,
        validUntil,
      },
      update: {
        amountMillimes: input.amountMillimes,
        advanceMillimes: input.advanceMillimes ?? null,
        scope: input.scope ?? null,
        validUntil,
      },
    });
    return tx.serviceRequest.update({
      where: { id: requestId },
      data: { status: 'QUOTE_SENT' },
      include: { business: true, quotation: true },
    });
  });
}

/** Customer accepts the quotation (records an in-person advance, no online pay). */
export async function acceptQuotation(customerId: string, requestId: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.serviceRequest.findUnique({
      where: { id: requestId },
      include: { quotation: true, business: true },
    });
    if (!request) throw notFound('Demande introuvable');
    if (request.customerId !== customerId) throw forbidden();
    if (!request.quotation) throw badRequest('Aucun devis à accepter');
    assertRequestTransition(request.status, 'ACCEPTED');
    return tx.serviceRequest.update({
      where: { id: requestId },
      data: { status: 'ACCEPTED' },
      include: { business: true, quotation: true },
    });
  });
}

export async function declineQuotation(customerId: string, requestId: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.serviceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw notFound('Demande introuvable');
    if (request.customerId !== customerId) throw forbidden();
    assertRequestTransition(request.status, 'DECLINED');
    return tx.serviceRequest.update({
      where: { id: requestId },
      data: { status: 'DECLINED' },
      include: { business: true, quotation: true },
    });
  });
}
