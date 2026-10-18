import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { badRequest } from './errors';

/** Where uploaded photos live on disk (served at /uploads). Git-ignored. */
export const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const MAX_BYTES = 4 * 1024 * 1024;

/** Detects the real image type from magic bytes (never trust the client's mime). */
function sniff(buf: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

/** Saves a base64 image and returns its public path (e.g. /uploads/<id>.jpg). */
export function saveImage(base64: string): string {
  const clean = base64.replace(/^data:image\/[a-z+]+;base64,/, '');
  const buf = Buffer.from(clean, 'base64');
  if (buf.length === 0) throw badRequest('Image vide');
  if (buf.length > MAX_BYTES) throw badRequest('Image trop lourde (4 Mo maximum)');
  const ext = sniff(buf);
  if (!ext) throw badRequest('Format d’image non pris en charge (JPEG, PNG ou WebP)');
  const name = `${randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, name), buf);
  return `/uploads/${name}`;
}

/** Best-effort removal of a previously uploaded file. */
export function deleteImage(publicPath: string | null | undefined) {
  if (!publicPath || !publicPath.startsWith('/uploads/')) return;
  const file = path.join(UPLOADS_DIR, path.basename(publicPath));
  fs.promises.unlink(file).catch(() => {});
}
