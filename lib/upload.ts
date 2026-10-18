import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { api } from './api';

export interface PickedImage {
  /** Local file URI, usable right away for previews. */
  uri: string;
  /** Resized JPEG as base64, ready to send. */
  base64: string;
}

/**
 * Opens the gallery, then shrinks the photo (max 1280 px wide, JPEG 70 %) so it
 * uploads quickly and stays well under the server's size limit.
 * Returns null if the user cancels.
 */
export async function pickImage(aspect: [number, number] = [4, 3]): Promise<PickedImage | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.9,
  });
  if (res.canceled || !res.assets?.[0]) return null;

  const asset = res.assets[0];
  const resize = asset.width > 1280 ? [{ resize: { width: 1280 } }] : [];
  const out = await ImageManipulator.manipulateAsync(asset.uri, resize, {
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!out.base64) return null;
  return { uri: out.uri, base64: out.base64 };
}

/** Uploads a gallery photo for a business. */
export function uploadBusinessPhoto(businessId: string, img: PickedImage) {
  return api.post<{ photo: { id: string; url: string }; coverImage: string }>(
    `/merchant/businesses/${businessId}/photos`,
    { data: img.base64 },
  );
}

/** Uploads a product picture. */
export function uploadProductImage(productId: string, img: PickedImage) {
  return api.post<{ image: string }>(`/merchant/products/${productId}/image`, { data: img.base64 });
}

/** Uploads or updates a business banner/cover image from base64 data. */
export function uploadCoverImage(businessId: string, img: PickedImage) {
  return api.post<{ business: unknown }>(`/merchant/businesses/${businessId}/cover`, { data: img.base64 });
}

/** Updates a business banner/cover image from an external URL. */
export function updateCoverUrl(businessId: string, url: string) {
  return api.post<{ business: unknown }>(`/merchant/businesses/${businessId}/cover`, { url });
}

/** Resets a business banner/cover image so the category default image is used. */
export function resetCoverToDefault(businessId: string) {
  return api.post<{ business: unknown; coverImage: null }>(`/merchant/businesses/${businessId}/cover`, { reset: true });
}


