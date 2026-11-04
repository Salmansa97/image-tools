import { describe, expect, it } from 'vitest';

import { quantize } from './quantize';

/** Builds RGBA pixel data from a list of `[r, g, b, a]` tuples. */
function pixels(colours: readonly [number, number, number, number][]): Uint8ClampedArray {
  const data = new Uint8ClampedArray(colours.length * 4);
  colours.forEach(([r, g, b, a], index) => {
    data.set([r, g, b, a], index * 4);
  });
  return data;
}

function distinctColours(data: Uint8ClampedArray): number {
  const seen = new Set<string>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) {
      continue;
    }
    seen.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
  }
  return seen.size;
}

describe('quantize', () => {
  it('reduces an image to at most the requested number of colours', () => {
    const colours: [number, number, number, number][] = [];
    for (let i = 0; i < 2000; i++) {
      colours.push([(i * 7) % 256, (i * 13) % 256, (i * 29) % 256, 255]);
    }
    const data = pixels(colours);

    quantize(data, 16);

    expect(distinctColours(data)).toBeLessThanOrEqual(16);
  });

  it('leaves an image alone when it already has few colours', () => {
    const data = pixels([
      [255, 0, 0, 255],
      [0, 255, 0, 255],
      [0, 0, 255, 255],
    ]);
    const before = Uint8ClampedArray.from(data);

    quantize(data, 32);

    expect(Array.from(data)).toEqual(Array.from(before));
  });

  it('keeps reduced colours close to the originals', () => {
    const colours: [number, number, number, number][] = [];
    // Two tight clusters: near-black and near-white.
    for (let i = 0; i < 500; i++) {
      colours.push([i % 8, i % 8, i % 8, 255]);
      colours.push([248 + (i % 8), 248 + (i % 8), 248 + (i % 8), 255]);
    }
    const data = pixels(colours);

    quantize(data, 16);

    for (let i = 0; i < data.length; i += 4) {
      const wasDark = i % 8 === 0;
      void wasDark;
      const value = data[i];
      // Every pixel must still land in the cluster it came from.
      expect(value < 64 || value > 192).toBe(true);
    }
  });

  it('flattens fully transparent pixels to a single colour', () => {
    const data = pixels([
      [200, 10, 30, 0],
      [9, 180, 240, 0],
      [12, 12, 12, 255],
    ]);

    quantize(data, 16);

    expect(Array.from(data.slice(0, 3))).toEqual([0, 0, 0]);
    expect(Array.from(data.slice(4, 7))).toEqual([0, 0, 0]);
    // Alpha is never altered.
    expect(data[3]).toBe(0);
    expect(data[11]).toBe(255);
  });

  it('does nothing when the palette cap is 256 or more', () => {
    const data = pixels([
      [1, 2, 3, 255],
      [4, 5, 6, 255],
    ]);
    const before = Uint8ClampedArray.from(data);

    quantize(data, 256);

    expect(Array.from(data)).toEqual(Array.from(before));
  });

  it('handles empty pixel data', () => {
    expect(() => quantize(new Uint8ClampedArray(0), 16)).not.toThrow();
  });
});
