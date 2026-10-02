import 'server-only';
import crypto from 'node:crypto';
import sharp from 'sharp';
import type { SupabaseClient } from '@supabase/supabase-js';
import { splitStoragePath } from '@/lib/media';

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp']);

export type ProcessedImage = { full: Buffer; thumb: Buffer; width: number; height: number };
export type ImageProblem = 'photoType' | 'photoSize' | 'photoBroken';

export function hasFile(value: FormDataEntryValue | null): value is File {
  return typeof value === 'object' && value !== null && 'size' in value && value.size > 0;
}

/**
 * Turns an uploaded file into a clean JPEG: checks it really is an image,
 * applies the camera's rotation, limits the size and drops all metadata
 * (GPS position, camera serial numbers). sharp removes metadata unless asked to keep it.
 */
export async function processImage(file: File): Promise<ProcessedImage | ImageProblem> {
  if (file.size > MAX_UPLOAD_BYTES) return 'photoSize';
  const input = Buffer.from(await file.arrayBuffer());

  let format: string | undefined;
  try {
    format = (await sharp(input).metadata()).format;
  } catch {
    return 'photoBroken';
  }
  if (!format || !ACCEPTED_FORMATS.has(format)) return 'photoType';

  try {
    const base = sharp(input).rotate();
    const full = await base
      .clone()
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });
    const thumb = await base
      .clone()
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    return { full: full.data, thumb, width: full.info.width, height: full.info.height };
  } catch {
    return 'photoBroken';
  }
}

/** Stores a processed image and returns 'bucket/key' paths for the full image and the thumbnail. */
export async function storeImage(
  client: SupabaseClient,
  bucket: 'media' | 'uploads',
  folder: string,
  image: ProcessedImage,
): Promise<{ path: string; thumbPath: string }> {
  const id = crypto.randomUUID();
  const key = `${folder}/${id}.jpg`;
  const thumbKey = `${folder}/${id}-thumb.jpg`;
  for (const [k, data] of [
    [key, image.full],
    [thumbKey, image.thumb],
  ] as const) {
    const { error } = await client.storage.from(bucket).upload(k, data, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) throw error;
  }
  return { path: `${bucket}/${key}`, thumbPath: `${bucket}/${thumbKey}` };
}

export function thumbPathFor(path: string): string {
  return path.replace(/\.jpg$/, '-thumb.jpg');
}

/** Moves an approved upload into the public media bucket. Returns the new path. */
export async function publishUpload(client: SupabaseClient, uploadPath: string, folder: string): Promise<string> {
  const { bucket, key } = splitStoragePath(uploadPath);
  if (bucket !== 'uploads') return uploadPath;
  const id = crypto.randomUUID();
  const targets: Array<[string, string]> = [
    [key, `${folder}/${id}.jpg`],
    [thumbPathFor(key), `${folder}/${id}-thumb.jpg`],
  ];
  for (const [from, to] of targets) {
    const { data, error } = await client.storage.from('uploads').download(from);
    if (error) {
      if (from !== key) continue; // a missing thumbnail is not fatal
      throw error;
    }
    const upload = await client.storage
      .from('media')
      .upload(to, Buffer.from(await data.arrayBuffer()), { contentType: 'image/jpeg', cacheControl: '31536000' });
    if (upload.error) throw upload.error;
  }
  await client.storage.from('uploads').remove([key, thumbPathFor(key)]);
  return `media/${folder}/${id}.jpg`;
}

/** Deletes an image (and its thumbnail) from whichever bucket it is in. Static files are left alone. */
export async function deleteImage(client: SupabaseClient, path: string | null | undefined) {
  if (!path || path.startsWith('/')) return;
  const { bucket, key } = splitStoragePath(path);
  if (bucket !== 'media' && bucket !== 'uploads') return;
  await client.storage.from(bucket).remove([key, thumbPathFor(key)]);
}
