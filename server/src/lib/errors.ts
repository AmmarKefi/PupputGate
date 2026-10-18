import type { Request, Response, NextFunction } from 'express';

export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (msg: string, details?: unknown) =>
  new HttpError(400, 'BAD_REQUEST', msg, details);
export const unauthorized = (msg = 'Non authentifié') =>
  new HttpError(401, 'UNAUTHORIZED', msg);
export const forbidden = (msg = 'Accès refusé') =>
  new HttpError(403, 'FORBIDDEN', msg);
export const notFound = (msg = 'Introuvable') =>
  new HttpError(404, 'NOT_FOUND', msg);
export const conflict = (msg: string, code = 'CONFLICT') =>
  new HttpError(409, code, msg);

/** Wrap async route handlers so thrown errors reach the error middleware. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  if (err instanceof HttpError) {
    res
      .status(err.status)
      .json({ error: err.message, code: err.code, details: err.details });
    return;
  }
  // Never leak internals / sensitive values.
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erreur interne', code: 'INTERNAL' });
}
