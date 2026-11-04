import { describe, expect, it } from 'vitest';

import { describeColor, extractPalette, luminance, toHex, toHsl, toRgbString } from './color';

function pixels(colours: readonly [number, number, number, number][]): Uint8ClampedArray {
  const data = new Uint8ClampedArray(colours.length * 4);
  colours.forEach(([r, g, b, a], index) => data.set([r, g, b, a], index * 4));
  return data;
}

describe('colour conversion', () => {
  it('formats HEX with padding', () => {
    expect(toHex({ r: 255, g: 0, b: 0 })).toBe('#ff0000');
    expect(toHex({ r: 1, g: 2, b: 3 })).toBe('#010203');
  });

  it('clamps out-of-range channels', () => {
    expect(toHex({ r: 300, g: -20, b: 128 })).toBe('#ff0080');
  });

  it('formats RGB', () => {
    expect(toRgbString({ r: 12, g: 34, b: 56 })).toBe('rgb(12, 34, 56)');
  });

  it('converts to HSL', () => {
    expect(toHsl({ r: 255, g: 0, b: 0 })).toEqual({ h: 0, s: 100, l: 50 });
    expect(toHsl({ r: 0, g: 255, b: 0 })).toEqual({ h: 120, s: 100, l: 50 });
    expect(toHsl({ r: 0, g: 0, b: 255 })).toEqual({ h: 240, s: 100, l: 50 });
  });

  it('reports greys as having no saturation', () => {
    expect(toHsl({ r: 128, g: 128, b: 128 }).s).toBe(0);
  });
});

describe('luminance and contrast', () => {
  it('ranks white above black', () => {
    expect(luminance({ r: 255, g: 255, b: 255 })).toBeGreaterThan(luminance({ r: 0, g: 0, b: 0 }));
  });

  it('picks a dark label on a light background and vice versa', () => {
    expect(describeColor({ r: 255, g: 255, b: 255 }).contrast).toBe('#0f172a');
    expect(describeColor({ r: 10, g: 10, b: 10 }).contrast).toBe('#ffffff');
  });
});

describe('extractPalette', () => {
  it('finds the distinct colours in an image', () => {
    const colours: [number, number, number, number][] = [];
    for (let i = 0; i < 300; i++) colours.push([255, 0, 0, 255]);
    for (let i = 0; i < 200; i++) colours.push([0, 0, 255, 255]);
    for (let i = 0; i < 100; i++) colours.push([0, 255, 0, 255]);

    const palette = extractPalette(pixels(colours), 8);

    expect(palette.length).toBe(3);
    expect(palette[0].hex).toBe('#ff0000');
    expect(palette.map((c) => c.hex).sort()).toEqual(['#0000ff', '#00ff00', '#ff0000']);
  });

  it('orders by how much of the image each colour covers', () => {
    const colours: [number, number, number, number][] = [];
    for (let i = 0; i < 90; i++) colours.push([255, 0, 0, 255]);
    for (let i = 0; i < 10; i++) colours.push([0, 0, 255, 255]);

    const palette = extractPalette(pixels(colours), 8);

    expect(palette[0].share).toBeGreaterThan(palette[1].share);
    expect(palette[0].share).toBe(90);
  });

  it('merges near-identical colours instead of returning five of the same blue', () => {
    const colours: [number, number, number, number][] = [];
    for (let i = 0; i < 400; i++) colours.push([100 + (i % 5), 120 + (i % 5), 240, 255]);

    const palette = extractPalette(pixels(colours), 8);

    expect(palette.length).toBe(1);
  });

  it('ignores fully transparent pixels', () => {
    const colours: [number, number, number, number][] = [];
    for (let i = 0; i < 100; i++) colours.push([255, 0, 0, 0]);
    for (let i = 0; i < 20; i++) colours.push([0, 255, 0, 255]);

    const palette = extractPalette(pixels(colours), 8);

    expect(palette.length).toBe(1);
    expect(palette[0].hex).toBe('#00ff00');
  });

  it('returns nothing for a fully transparent image', () => {
    expect(extractPalette(pixels([[1, 2, 3, 0]]), 8)).toEqual([]);
  });

  it('respects the requested palette size', () => {
    const colours: [number, number, number, number][] = [];
    for (let i = 0; i < 2000; i++) {
      colours.push([(i * 37) % 256, (i * 71) % 256, (i * 113) % 256, 255]);
    }
    expect(extractPalette(pixels(colours), 4).length).toBeLessThanOrEqual(4);
  });
});
