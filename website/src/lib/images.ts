/*
 * Photos are prepared in the browser before they are saved: turned upright, scaled down,
 * and saved again as JPEG. Saving again also drops everything else the file carried,
 * such as the place where the photo was taken.
 */

export type PreparedImage = { full: Blob; thumb: Blob; width: number; height: number };

export class ImageError extends Error {}

const FULL = 2000; // longest side of the photo that opens large
const THUMB = 720; // longest side of the small version in lists and grids
const QUALITY = 0.86;
const MAX_FILE = 40 * 1024 * 1024;

async function decode(file: Blob): Promise<CanvasImageSource & { width: number; height: number }> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Older browsers: let an <img> decode it.
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return Object.assign(img, { width: img.naturalWidth, height: img.naturalHeight });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function render(source: CanvasImageSource, width: number, height: number, longest: number): Promise<Blob> {
  const scale = Math.min(1, longest / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new ImageError('no canvas');
  // JPEG has no transparency: transparent parts become the page colour, not black.
  context.fillStyle = '#faf7f2';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new ImageError('encode failed'))), 'image/jpeg', QUALITY),
  );
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (file.size > MAX_FILE) throw new ImageError('too large');
  let source: CanvasImageSource & { width: number; height: number };
  try {
    source = await decode(file);
  } catch {
    throw new ImageError('unreadable');
  }
  const { width, height } = source;
  if (!width || !height) throw new ImageError('unreadable');
  const full = await render(source, width, height, FULL);
  const thumb = await render(source, width, height, THUMB);
  if ('close' in source && typeof source.close === 'function') source.close();
  const scale = Math.min(1, FULL / Math.max(width, height));
  return { full, thumb, width: Math.round(width * scale), height: Math.round(height * scale) };
}
