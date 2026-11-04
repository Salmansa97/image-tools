import { describe, expect, it } from 'vitest';

import { readMetadata } from './metadata';

/* -------------------------------------------------------------------------- */
/* Builders — minimal but structurally valid containers                       */
/* -------------------------------------------------------------------------- */

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

/**
 * Builds a JPEG with an SOF0 frame and an EXIF APP1 segment containing IFD0
 * camera fields plus a GPS IFD. Enough structure for the parser to walk.
 */
function buildExifJpeg(): Uint8Array {
  const tiff = new ArrayBuffer(512);
  const view = new DataView(tiff);
  let p = 0;

  const u16 = (v: number) => {
    view.setUint16(p, v, true);
    p += 2;
  };
  const u32 = (v: number) => {
    view.setUint32(p, v, true);
    p += 4;
  };

  writeAscii(view, 0, 'II');
  p = 2;
  u16(42);
  u32(8);

  const make = 'TestMake\0';
  const model = 'TestModel\0';

  // IFD0: 4 entries + next-IFD pointer, then the string data.
  const ifd0Entries = 4;
  let dataPos = 8 + 2 + 12 * ifd0Entries + 4;
  const makeOffset = dataPos;
  dataPos += make.length;
  const modelOffset = dataPos;
  dataPos += model.length;
  const gpsOffset = dataPos;

  p = 8;
  u16(ifd0Entries);

  // Make (ASCII)
  u16(0x010f);
  u16(2);
  u32(make.length);
  u32(makeOffset);
  // Model (ASCII)
  u16(0x0110);
  u16(2);
  u32(model.length);
  u32(modelOffset);
  // Orientation (SHORT, inline) — 6 = rotated 90° CW
  u16(0x0112);
  u16(3);
  u32(1);
  u32(6);
  // GPS IFD pointer (LONG)
  u16(0x8825);
  u16(4);
  u32(1);
  u32(gpsOffset);
  u32(0); // no IFD1

  writeAscii(view, makeOffset, make);
  writeAscii(view, modelOffset, model);

  // GPS IFD: 4 entries, two refs inline and two rational triples out of line.
  p = gpsOffset;
  const gpsEntries = 4;
  let gpsData = gpsOffset + 2 + 12 * gpsEntries + 4;
  const latOffset = gpsData;
  gpsData += 24;
  const lonOffset = gpsData;

  u16(gpsEntries);
  // GPSLatitudeRef = 'N'
  u16(0x0001);
  u16(2);
  u32(2);
  writeAscii(view, p, 'N\0');
  p += 4;
  // GPSLatitude = 51/1, 30/1, 0/1
  u16(0x0002);
  u16(5);
  u32(3);
  u32(latOffset);
  // GPSLongitudeRef = 'W'
  u16(0x0003);
  u16(2);
  u32(2);
  writeAscii(view, p, 'W\0');
  p += 4;
  // GPSLongitude = 0/1, 6/1, 0/1
  u16(0x0004);
  u16(5);
  u32(3);
  u32(lonOffset);
  u32(0);

  const rational = (offset: number, triples: [number, number][]) => {
    triples.forEach(([n, d], i) => {
      view.setUint32(offset + i * 8, n, true);
      view.setUint32(offset + i * 8 + 4, d, true);
    });
  };
  rational(latOffset, [
    [51, 1],
    [30, 1],
    [0, 1],
  ]);
  rational(lonOffset, [
    [0, 1],
    [6, 1],
    [0, 1],
  ]);

  const tiffBytes = new Uint8Array(tiff, 0, Math.max(dataPos, gpsData + 24));
  const exifHeader = new TextEncoder().encode('Exif\0\0');

  // SOI + APP1(EXIF) + SOF0 + EOI
  const app1Length = exifHeader.length + tiffBytes.length + 2;
  const sof0 = [
    0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x58, 0x03, 0x20, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01,
    0x03, 0x11, 0x01,
  ];

  const out: number[] = [0xff, 0xd8, 0xff, 0xe1, (app1Length >> 8) & 0xff, app1Length & 0xff];
  out.push(...exifHeader, ...tiffBytes, ...sof0, 0xff, 0xd9);
  return new Uint8Array(out);
}

/** Builds a PNG with IHDR and a tEXt chunk. */
function buildPng(): Uint8Array {
  const out: number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

  const chunk = (type: string, data: number[]) => {
    const length = data.length;
    out.push((length >>> 24) & 0xff, (length >>> 16) & 0xff, (length >>> 8) & 0xff, length & 0xff);
    for (const ch of type) out.push(ch.charCodeAt(0));
    out.push(...data);
    out.push(0, 0, 0, 0); // CRC is not validated by the reader
  };

  // IHDR: 800 × 600, 8-bit, colour type 6 (RGBA), no interlace.
  chunk('IHDR', [0, 0, 0x03, 0x20, 0, 0, 0x02, 0x58, 8, 6, 0, 0, 0]);

  const text = 'Software\0ImageTools';
  chunk('tEXt', Array.from(new TextEncoder().encode(text)));
  chunk('IEND', []);

  return new Uint8Array(out);
}

/** Builds a WebP with a VP8X chunk declaring alpha. */
function buildWebp(): Uint8Array {
  const body: number[] = [];
  for (const ch of 'WEBP') body.push(ch.charCodeAt(0));
  for (const ch of 'VP8X') body.push(ch.charCodeAt(0));
  body.push(10, 0, 0, 0); // chunk length, little-endian
  body.push(0b0001_0000); // alpha flag
  body.push(0, 0, 0);
  // Canvas size minus one, 24-bit little-endian: 640 × 480.
  body.push(0x7f, 0x02, 0x00);
  body.push(0xdf, 0x01, 0x00);

  const out: number[] = [];
  for (const ch of 'RIFF') out.push(ch.charCodeAt(0));
  const size = body.length;
  out.push(size & 0xff, (size >> 8) & 0xff, (size >> 16) & 0xff, (size >> 24) & 0xff);
  out.push(...body);
  return new Uint8Array(out);
}

function asFile(bytes: Uint8Array, name: string, type: string): File {
  return new File([bytes as BlobPart], name, { type });
}

/* -------------------------------------------------------------------------- */

describe('readMetadata — JPEG', () => {
  it('reads dimensions from the SOF0 frame', async () => {
    const data = await readMetadata(asFile(buildExifJpeg(), 'photo.jpg', 'image/jpeg'));
    expect(data.format).toBe('JPEG');
    expect(data.width).toBe(800);
    expect(data.height).toBe(600);
  });

  it('reports that EXIF is present', async () => {
    const data = await readMetadata(asFile(buildExifJpeg(), 'photo.jpg', 'image/jpeg'));
    expect(data.hasExif).toBe(true);
    expect(data.metadataBytes).toBeGreaterThan(0);
  });

  it('reads the camera make and model', async () => {
    const data = await readMetadata(asFile(buildExifJpeg(), 'photo.jpg', 'image/jpeg'));
    const camera = data.groups.find((g) => g.name === 'Camera');
    const entries = Object.fromEntries((camera?.entries ?? []).map((e) => [e.label, e.value]));

    expect(entries['Camera make']).toBe('TestMake');
    expect(entries['Camera model']).toBe('TestModel');
  });

  it('decodes the orientation tag to a readable value', async () => {
    const data = await readMetadata(asFile(buildExifJpeg(), 'photo.jpg', 'image/jpeg'));
    const camera = data.groups.find((g) => g.name === 'Camera');
    const orientation = camera?.entries.find((e) => e.label === 'Orientation');
    expect(orientation?.value).toBe('Rotated 90° CW');
  });

  it('converts GPS degrees, minutes and seconds into decimal', async () => {
    const data = await readMetadata(asFile(buildExifJpeg(), 'photo.jpg', 'image/jpeg'));
    expect(data.gps).not.toBeNull();
    expect(data.gps!.latitude).toBeCloseTo(51.5, 4);
    // 'W' must make the longitude negative.
    expect(data.gps!.longitude).toBeCloseTo(-0.1, 4);
  });

  it('warns that the location is recorded', async () => {
    const data = await readMetadata(asFile(buildExifJpeg(), 'photo.jpg', 'image/jpeg'));
    expect(data.notes.some((n) => n.includes('location'))).toBe(true);
  });

  it('reports a plain JPEG as carrying no EXIF', async () => {
    const plain = new Uint8Array([
      0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x64, 0x00, 0xc8, 0x03, 0x01, 0x22, 0x00,
      0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9,
    ]);
    const data = await readMetadata(asFile(plain, 'plain.jpg', 'image/jpeg'));

    expect(data.hasExif).toBe(false);
    expect(data.gps).toBeNull();
    expect(data.width).toBe(200);
    expect(data.height).toBe(100);
    expect(data.notes.some((n) => n.includes('no EXIF'))).toBe(true);
  });
});

describe('readMetadata — PNG', () => {
  it('reads the IHDR header', async () => {
    const data = await readMetadata(asFile(buildPng(), 'image.png', 'image/png'));
    expect(data.format).toBe('PNG');
    expect(data.width).toBe(800);
    expect(data.height).toBe(600);
  });

  it('describes the colour type', async () => {
    const data = await readMetadata(asFile(buildPng(), 'image.png', 'image/png'));
    const image = data.groups.find((g) => g.name === 'Image');
    const colour = image?.entries.find((e) => e.label === 'Colour type');
    expect(colour?.value).toContain('RGBA');
  });

  it('reads tEXt chunks', async () => {
    const data = await readMetadata(asFile(buildPng(), 'image.png', 'image/png'));
    const text = data.groups.find((g) => g.name === 'Text chunks');
    expect(text?.entries[0]).toEqual({ label: 'Software', value: 'ImageTools' });
  });
});

describe('readMetadata — WebP', () => {
  it('reads dimensions and the alpha flag from VP8X', async () => {
    const data = await readMetadata(asFile(buildWebp(), 'image.webp', 'image/webp'));
    expect(data.format).toBe('WebP');
    expect(data.width).toBe(640);
    expect(data.height).toBe(480);

    const image = data.groups.find((g) => g.name === 'Image');
    const transparency = image?.entries.find((e) => e.label === 'Transparency');
    expect(transparency?.value).toContain('Yes');
  });
});

describe('readMetadata — unsupported input', () => {
  it('returns an empty result rather than throwing', async () => {
    const data = await readMetadata(asFile(new Uint8Array([1, 2, 3, 4]), 'file.bin', ''));
    expect(data.format).toBe('Unknown');
    expect(data.groups).toEqual([]);
    expect(data.notes.length).toBeGreaterThan(0);
  });
});
