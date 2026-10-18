import { API_BASE_URL } from './config';

/**
 * Turns an image reference from the API into something <Image> can load.
 * Uploaded photos come back as `/uploads/<id>.jpg` (served by the API), so they
 * need the API origin in front; full URLs and local `file:` URIs pass through.
 */
export function assetUrl(ref: string | null | undefined): string | null {
  if (!ref || typeof ref !== 'string') return null;
  const trimmed = ref.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('/uploads/')) return `${API_BASE_URL}${trimmed}`;
  if (trimmed.startsWith('uploads/')) return `${API_BASE_URL}/${trimmed}`;
  return trimmed;
}
