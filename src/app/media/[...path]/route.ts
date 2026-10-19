import { promises as fs } from 'node:fs';
import { localFile } from '@/lib/local/media';
import { hasDatabase, isLocalMode } from '@/lib/mode';

const SAFE_KEY = /^[a-z]+\/[0-9a-f-]+\/[0-9a-f-]+(-thumb)?\.jpg$/;

/**
 * Approved images, always from this site's own address.
 *
 * With a database, /media/... is normally rewritten to Supabase Storage before this route is
 * reached (next.config.ts). Rewrites are fixed when the app is built, so if the Supabase
 * settings were added after the build, this route fetches the image instead.
 * In local mode the images are files in data/media/.
 */
export async function GET(_request: Request, { params }: RouteContext<'/media/[...path]'>) {
  const key = (await params).path.join('/');
  if (!SAFE_KEY.test(key)) return new Response('Not found', { status: 404 });

  if (hasDatabase()) {
    const base = process.env.SUPABASE_URL!.replace(/\/$/, '');
    const upstream = await fetch(`${base}/storage/v1/object/public/media/${key}`);
    if (!upstream.ok) return new Response('Not found', { status: 404 });
    return new Response(upstream.body, {
      headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable' },
    });
  }

  if (!isLocalMode()) return new Response('Not found', { status: 404 });
  const file = localFile('media', key);
  if (!file) return new Response('Not found', { status: 404 });
  try {
    const bytes = await fs.readFile(file);
    return new Response(new Uint8Array(bytes), {
      headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=3600' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
