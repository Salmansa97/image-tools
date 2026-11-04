/**
 * Content-based image type detection.
 *
 * `File.type` is supplied by the operating system from the file's extension, so
 * renaming `script.exe` to `photo.png` is enough to defeat it. Reading the actual
 * magic bytes is the only trustworthy check, and it also lets us tell a user
 * precisely what they handed us ("this is a HEIC file") instead of a vague
 * rejection.
 */

/** Formats we can name, whether or not we can process them. */
export type SniffedType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'image/gif'
  | 'image/bmp'
  | 'image/tiff'
  | 'image/avif'
  | 'image/heic'
  | 'image/x-icon'
  | 'image/svg+xml'
  | null;

/** Enough bytes to cover every signature below, including ISO-BMFF `ftyp`. */
const HEADER_BYTES = 64;

const LABELS: Record<NonNullable<SniffedType>, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/gif': 'GIF',
  'image/bmp': 'BMP',
  'image/tiff': 'TIFF',
  'image/avif': 'AVIF',
  'image/heic': 'HEIC',
  'image/x-icon': 'ICO',
  'image/svg+xml': 'SVG',
};

export function sniffedLabel(type: SniffedType): string {
  return type ? LABELS[type] : 'an unrecognised file';
}

/** Reads a blob's leading bytes and identifies the format it really is. */
export async function sniffImageType(blob: Blob): Promise<SniffedType> {
  const header = new Uint8Array(await blob.slice(0, HEADER_BYTES).arrayBuffer());
  return identify(header);
}

export function identify(bytes: Uint8Array): SniffedType {
  if (bytes.length < 4) {
    return null;
  }

  // JPEG: SOI marker.
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: fixed 8-byte signature.
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  // RIFF container: WebP is identified by the form type at offset 8.
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    return 'image/webp';
  }

  if (ascii(bytes, 0, 3) === 'GIF') {
    return 'image/gif';
  }

  if (bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return 'image/bmp';
  }

  // TIFF: little- or big-endian byte-order mark followed by 42.
  if (
    (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
    (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a)
  ) {
    return 'image/tiff';
  }

  // ICO / CUR: reserved word 0, then type 1 or 2.
  if (
    bytes[0] === 0x00 &&
    bytes[1] === 0x00 &&
    (bytes[2] === 0x01 || bytes[2] === 0x02) &&
    bytes[3] === 0x00
  ) {
    return 'image/x-icon';
  }

  // ISO base media container (AVIF, HEIC): 'ftyp' box with a brand we recognise.
  if (ascii(bytes, 4, 4) === 'ftyp') {
    const brand = ascii(bytes, 8, 4);
    if (brand === 'avif' || brand === 'avis') {
      return 'image/avif';
    }
    if (brand.startsWith('hei') || brand.startsWith('mif') || brand.startsWith('msf')) {
      return 'image/heic';
    }
  }

  // SVG is text; look for a root element in the first chunk, skipping any BOM,
  // XML declaration or comment.
  const text = ascii(bytes, 0, Math.min(bytes.length, HEADER_BYTES)).trimStart();
  if (text.startsWith('<?xml') || text.startsWith('<svg') || text.startsWith('<!--')) {
    if (text.includes('<svg') || text.startsWith('<?xml')) {
      return 'image/svg+xml';
    }
  }

  return null;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  let out = '';
  for (let i = offset; i < offset + length && i < bytes.length; i += 1) {
    out += String.fromCharCode(bytes[i]);
  }
  return out;
}
