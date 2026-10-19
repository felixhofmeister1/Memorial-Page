import { promises as fs } from 'node:fs';
import { localFile } from '@/lib/local/media';
import { isLocalMode, isLocalRequest } from '@/lib/mode';

/** Photos sent by visitors, waiting for moderation. Local mode only, and only on this computer. */
export async function GET(_request: Request, { params }: RouteContext<'/local-uploads/[...path]'>) {
  if (!isLocalMode() || !(await isLocalRequest())) return new Response('Not found', { status: 404 });
  const file = localFile('uploads', (await params).path.join('/'));
  if (!file || !file.endsWith('.jpg')) return new Response('Not found', { status: 404 });
  try {
    const bytes = await fs.readFile(file);
    return new Response(new Uint8Array(bytes), { headers: { 'content-type': 'image/jpeg', 'cache-control': 'no-store' } });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
