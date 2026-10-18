import { PrismaClient } from '@prisma/client';

// Single PrismaClient instance reused across the process.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'test' ? [] : ['warn', 'error'],
});

export type Tx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];
