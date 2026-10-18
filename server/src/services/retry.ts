/**
 * Retry a transaction a few times on Postgres serialization failures
 * (Prisma error code P2034 / SQLSTATE 40001).
 */
export async function withSerializationRetry<T>(
  fn: () => Promise<T>,
  attempts = 4,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'P2034' || code === '40001') {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 15 * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}
