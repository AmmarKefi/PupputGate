// Pending-action helpers. A guest who must sign in mid-flow (booking, order, quote)
// is sent to /login with the exact screen and form state encoded in `returnTo`.

/** Returns the return path only if it is a safe, in-app absolute path. */
export function safeReturnTo(value: string | string[] | undefined | null): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v || !v.startsWith('/') || v.startsWith('//') || v.includes('\\')) return null;
  return v;
}

/** Builds `path?key=value&...`, skipping empty values. */
export function withQuery(path: string, params: Record<string, string | null | undefined>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${path}?${qs}` : path;
}

/** Login href that returns the user to `returnPath` after authentication. */
export function signInHref(returnPath: string): string {
  return withQuery('/login', { returnTo: returnPath });
}
