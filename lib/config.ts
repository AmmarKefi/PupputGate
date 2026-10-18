import Constants from 'expo-constants';

/**
 * Resolve the API base URL.
 *
 * Priority:
 *  1. EXPO_PUBLIC_API_URL (explicit override) or app config `extra.apiUrl`.
 *  2. Derived from the Expo packager host — on a physical device in Expo Go this
 *     is your dev machine's LAN IP, so the API is reachable with no manual setup
 *     as long as the API listens on port 4000.
 *  3. localhost:4000 (simulator / web fallback).
 */
const API_PORT = 4000;

function deriveFromPackager(): string | null {
  // e.g. "192.168.1.10:8081" or "exp://192.168.1.10:8081"
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost ??
    null;
  if (!hostUri) return null;
  const host = String(hostUri).replace(/^\w+:\/\//, '').split(':')[0];
  if (!host) return null;
  return `http://${host}:${API_PORT}`;
}

const explicitRaw: unknown =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: unknown } | undefined)?.apiUrl ??
  null;

// Expo can serialise an unset value as `{}`; only accept a real URL string.
const explicit = typeof explicitRaw === 'string' && /^https?:\/\//.test(explicitRaw) ? explicitRaw : null;

export const API_BASE_URL = explicit || deriveFromPackager() || `http://localhost:${API_PORT}`;

export const config = {
  apiBaseUrl: API_BASE_URL,
  pollIntervalMs: 15000, // demo polling; honest, not push
  businessTimezone: 'Africa/Tunis',
  currency: 'DT',
};
