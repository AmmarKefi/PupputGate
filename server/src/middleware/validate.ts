import type { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { badRequest } from '../lib/errors';

/** Validate and REPLACE req.body with the parsed, typed result. */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      next(badRequest('Données invalides', parsed.error.flatten()));
      return;
    }
    req.body = parsed.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      next(badRequest('Paramètres invalides', parsed.error.flatten()));
      return;
    }
    (req as Request & { valid?: unknown }).valid = parsed.data;
    next();
  };
}
