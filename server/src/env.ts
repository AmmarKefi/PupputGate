import 'dotenv/config';

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export const env = {
  databaseUrl: required('DATABASE_URL'),
  port: parseInt(process.env.PORT ?? '4000', 10),
  tokenSecret: required('AUTH_TOKEN_SECRET', 'dev-insecure-secret-change-me'),
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  tokenTtlDays: 30,
  /** New shops go live immediately unless AUTO_APPROVE_BUSINESSES=false (or in production). */
  autoApproveBusinesses:
    (process.env.AUTO_APPROVE_BUSINESSES ?? (process.env.NODE_ENV === 'production' ? 'false' : 'true')) === 'true',
};
