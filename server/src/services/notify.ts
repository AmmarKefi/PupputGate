import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma';

/**
 * SIMULATED communication log only. This records what an SMS reminder WOULD
 * contain for a future real SMS integration. It never sends anything and never
 * implies a message was delivered. The UI shows these as "simulation".
 */
const TEMPLATES: Record<string, string> = {
  appointment_requested:
    'PupputGate (simulation) : votre demande de rendez-vous a été enregistrée.',
  appointment_confirmed:
    'PupputGate (simulation) : votre rendez-vous est confirmé.',
  order_ready:
    'PupputGate (simulation) : votre commande est prête à être retirée.',
};

export async function logSimulatedReminder(
  businessId: string,
  recipient: string,
  templateKey: keyof typeof TEMPLATES | string,
) {
  const body = TEMPLATES[templateKey] ?? 'PupputGate (simulation).';
  await prisma.communicationLog
    .create({
      data: {
        businessId,
        recipient: recipient || 'n/a',
        body,
        channel: 'SMS_SIMULATED',
        simulated: true,
      },
    })
    .catch(() => {
      /* non-critical */
    });
}

export async function notifyUser(
  userId: string,
  titleKey: string,
  bodyKey: string,
  data?: Prisma.InputJsonObject,
) {
  await prisma.notification
    .create({ data: { userId, titleKey, bodyKey, data: data ?? undefined } })
    .catch(() => {});
}
