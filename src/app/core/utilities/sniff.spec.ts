import { describe, expect, it } from 'vitest';

import { identify, sniffedLabel } from './sniff';

function bytes(...values: number[]): Uint8Array {
  // Pad to 64 so the ISO-BMFF and SVG branches have something to read.
  const out = new Uint8Array(64);
  out.set(values);
  return out;
}

function ascii(text: string, offset = 0): Uint8Array {
  const out = new Uint8Array(64);
  for (let i = 0; i < text.length; i += 1) {
    out[offset + i] = text.charCodeAt(i);
  }
  return out;
}

describe('identify', () => {
  it('recognises JPEG', () => {
    expect(identify(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg');
  });

  it('recognises PNG by its full eight-byte signature', () => {
    expect(identify(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image/png');
  });

  it('does not mistake a partial PNG signature', () => {
    expect(identify(bytes(0x89, 0x50, 0x4e, 0x47, 0x00, 0x00, 0x00, 0x00))).toBeNull();
  });

  it('recognises WebP only when the RIFF form type matches', () => {
    const webp = ascii('RIFF');
    webp.set(ascii('WEBP').subarray(0, 4), 8);
    expect(identify(webp)).toBe('image/webp');

    const wave = ascii('RIFF');
    wave.set(ascii('WAVE').subarray(0, 4), 8);
    expect(identify(wave)).toBeNull();
  });

  it('recognises GIF and BMP', () => {
    expect(identify(ascii('GIF89a'))).toBe('image/gif');
    expect(identify(bytes(0x42, 0x4d))).toBe('image/bmp');
  });

  it('recognises TIFF in both byte orders', () => {
    expect(identify(bytes(0x49, 0x49, 0x2a, 0x00))).toBe('image/tiff');
    expect(identify(bytes(0x4d, 0x4d, 0x00, 0x2a))).toBe('image/tiff');
  });

  it('recognises ICO', () => {
    expect(identify(bytes(0x00, 0x00, 0x01, 0x00))).toBe('image/x-icon');
  });

  it('distinguishes AVIF from HEIC by brand', () => {
    const avif = ascii('ftyp', 4);
    avif.set(ascii('avif').subarray(0, 4), 8);
    expect(identify(avif)).toBe('image/avif');

    const heic = ascii('ftyp', 4);
    heic.set(ascii('heic').subarray(0, 4), 8);
    expect(identify(heic)).toBe('image/heic');
  });

  it('recognises SVG', () => {
    expect(identify(ascii('<svg xmlns="http://www.w3.org/2000/svg">'))).toBe('image/svg+xml');
    expect(identify(ascii('<?xml version="1.0"?><svg>'))).toBe('image/svg+xml');
  });

  it('returns null for plain text and for truncated input', () => {
    expect(identify(ascii('just some words'))).toBeNull();
    expect(identify(new Uint8Array([0xff]))).toBeNull();
  });

  it('is not fooled by a JPEG that claims to be a PNG', () => {
    // The whole point: the extension says PNG, the bytes say JPEG.
    expect(identify(bytes(0xff, 0xd8, 0xff, 0xdb))).toBe('image/jpeg');
  });
});

describe('sniffedLabel', () => {
  it('names each format for the user', () => {
    expect(sniffedLabel('image/heic')).toBe('HEIC');
    expect(sniffedLabel('image/webp')).toBe('WebP');
  });

  it('describes an unrecognised file', () => {
    expect(sniffedLabel(null)).toBe('an unrecognised file');
  });
});
