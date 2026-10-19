import 'server-only';
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { dataDir } from './store';

/*
 * Local mode image files, in the same layout as the Supabase buckets:
 *   data/media/...    approved images, served at /media/...
 *   data/uploads/...  sent by visitors, waiting for moderation, only shown in the local admin
 */

type Bucket = 'media' | 'uploads';

/** Absolute path of a stored file. Refuses anything that would leave the bucket folder. */
export function localFile(bucket: Bucket, key: string): string | null {
  const root = path.join(dataDir(), bucket);
  const full = path.resolve(root, key);
  return full.startsWith(root + path.sep) ? full : null;
}

const thumbOf = (key: string) => key.replace(/\.jpg$/, '-thumb.jpg');

export async function storeLocal(bucket: Bucket, folder: string, full: Buffer, thumb: Buffer) {
  const id = crypto.randomUUID();
  const key = `${folder}/${id}.jpg`;
  for (const [k, bytes] of [
    [key, full],
    [thumbOf(key), thumb],
  ] as const) {
    const file = localFile(bucket, k);
    if (!file) throw new Error('bad image path');
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, bytes);
  }
  return { path: `${bucket}/${key}`, thumbPath: `${bucket}/${thumbOf(key)}` };
}

/** Moves an approved upload into media/. Returns the new path. */
export async function publishLocal(uploadKey: string, folder: string): Promise<string> {
  const id = crypto.randomUUID();
  const targetKey = `${folder}/${id}.jpg`;
  for (const [from, to] of [
    [uploadKey, targetKey],
    [thumbOf(uploadKey), thumbOf(targetKey)],
  ]) {
    const source = localFile('uploads', from);
    const target = localFile('media', to);
    if (!source || !target) throw new Error('bad image path');
    try {
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.rename(source, target);
    } catch (error) {
      if (from !== uploadKey) continue; // a missing thumbnail is not fatal
      throw error;
    }
  }
  return `media/${targetKey}`;
}

export async function removeLocal(bucket: Bucket, key: string) {
  for (const k of [key, thumbOf(key)]) {
    const file = localFile(bucket, k);
    if (file) await fs.rm(file, { force: true });
  }
}
