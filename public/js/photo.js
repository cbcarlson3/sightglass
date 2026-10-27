// Gets a photo ready to send: shrinks it and strips EXIF (including GPS location).
// Redrawing on a canvas already drops EXIF; stripJpegMetadata() then checks the bytes anyway.

// Claude's vision works best with the long edge at or under 1568 px.
export const MAX_EDGE = 1568;
export const JPEG_QUALITY = 0.85;

// Scale (width, height) down to fit within maxEdge. Never scales up.
export function fitWithin(width, height, maxEdge = MAX_EDGE) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

// Remove every APPn segment except APP0 (JFIF), plus comments, from a JPEG. APP1 holds EXIF and
// GPS, APP13 holds IPTC, and so on. Image data after the start-of-scan marker is copied as-is.
export function stripJpegMetadata(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Not a JPEG');
  const kept = [bytes.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff) throw new Error('Bad JPEG segment');
    const marker = bytes[i + 1];
    if (marker === 0xda) {
      kept.push(bytes.subarray(i));
      break;
    }
    const length = (bytes[i + 2] << 8) | bytes[i + 3];
    const segment = bytes.subarray(i, i + 2 + length);
    const isMetadata = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;
    if (!isMetadata) kept.push(segment);
    i += 2 + length;
  }
  const out = new Uint8Array(kept.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of kept) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export async function preparePhoto(file) {
  const { image, release } = await loadImage(file);
  const { width, height } = fitWithin(image.width, image.height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  try {
    canvas.getContext('2d').drawImage(image, 0, 0, width, height);
  } finally {
    release();
  }

  const encoded = await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not read photo'))),
      'image/jpeg', JPEG_QUALITY);
  });
  const clean = stripJpegMetadata(new Uint8Array(await encoded.arrayBuffer()));
  return {
    blob: new Blob([clean], { type: 'image/jpeg' }),
    width,
    height,
    originalBytes: file.size,
    bytes: clean.length,
  };
}

// createImageBitmap applies the EXIF rotation, so sideways phone photos come out upright.
// Returns the image plus a release() to free its memory once it has been drawn.
async function loadImage(file) {
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { image: bitmap, release: () => bitmap.close() };
    } catch {
      // Some browsers can't decode every format this way; fall back to an <img>.
    }
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
  return { image: img, release: () => URL.revokeObjectURL(url) };
}

export function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
