/**
 * Thumbnail generation service
 * Generates and caches thumbnails for media resources.
 * Instead of loading 10-30MB originals, thumbnails are ~20-50KB WebP images.
 */

import sharp from "sharp";
import { storagePut } from "./storage";

const THUMB_WIDTH = 400;
const THUMB_QUALITY = 72;

// In-memory cache of thumbnail URLs to avoid DB lookups
const thumbCache = new Map<number, string>();

/**
 * Generate a thumbnail from a buffer and upload to S3.
 */
export async function generateThumbnailFromBuffer(
  buffer: Buffer,
  resourceId: number
): Promise<string> {
  const thumbBuffer = await sharp(buffer)
    .resize(THUMB_WIDTH, THUMB_WIDTH, {
      fit: "cover",
      position: "centre",
      withoutEnlargement: true,
    })
    .webp({ quality: THUMB_QUALITY })
    .toBuffer();

  const thumbKey = `thumbnails/resource-${resourceId}-${THUMB_WIDTH}w.webp`;
  const { url } = await storagePut(thumbKey, thumbBuffer, "image/webp");

  thumbCache.set(resourceId, url);
  return url;
}

/**
 * Generate a thumbnail from a remote URL and upload to S3.
 */
export async function generateThumbnailFromUrl(
  originalUrl: string,
  resourceId: number
): Promise<string> {
  // Check memory cache first
  const cached = thumbCache.get(resourceId);
  if (cached) return cached;

  const response = await fetch(originalUrl);
  if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());

  return generateThumbnailFromBuffer(buffer, resourceId);
}

/**
 * Check if a file type is an image that can be thumbnailed
 */
export function isThumbableImage(fileType: string): boolean {
  return /^image\/(jpeg|jpg|png|webp|gif|tiff|bmp|avif)$/i.test(fileType);
}

/**
 * Get cached thumbnail URL
 */
export function getCachedThumb(resourceId: number): string | undefined {
  return thumbCache.get(resourceId);
}

/**
 * Set cached thumbnail URL
 */
export function setCachedThumb(resourceId: number, url: string): void {
  thumbCache.set(resourceId, url);
}
