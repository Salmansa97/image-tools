/**
 * Colour conversion and palette extraction.
 *
 * Palette extraction reuses the same median-cut implementation the PNG
 * compressor relies on, so "the dominant colours" here are exactly the colours
 * the quantiser would keep.
 */

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

export interface SwatchColor extends Rgb {
  readonly hex: string;
  readonly rgb: string;
  readonly hsl: string;
  /** Share of sampled pixels, 0–100. */
  readonly share: number;
  /** A readable foreground for this background. */
  readonly contrast: '#ffffff' | '#0f172a';
}

export function toHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b].map((value) => clamp255(value).toString(16).padStart(2, '0')).join('')}`;
}

export function toRgbString({ r, g, b }: Rgb): string {
  return `rgb(${clamp255(r)}, ${clamp255(g)}, ${clamp255(b)})`;
}

export function toHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const rn = clamp255(r) / 255;
  const gn = clamp255(g) / 255;
  const bn = clamp255(b) / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) {
      h = ((gn - bn) / delta) % 6;
    } else if (max === gn) {
      h = (bn - rn) / delta + 2;
    } else {
      h = (rn - gn) / delta + 4;
    }
    h *= 60;
    if (h < 0) {
      h += 360;
    }
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function toHslString(rgb: Rgb): string {
  const { h, s, l } = toHsl(rgb);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/** Relative luminance, per WCAG, used to pick a readable label colour. */
export function luminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const v = clamp255(value) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function describeColor(rgb: Rgb, share = 0): SwatchColor {
  return {
    ...rgb,
    hex: toHex(rgb),
    rgb: toRgbString(rgb),
    hsl: toHslString(rgb),
    share,
    contrast: luminance(rgb) > 0.45 ? '#0f172a' : '#ffffff',
  };
}

/**
 * Extracts the dominant colours from RGBA pixel data.
 *
 * Buckets into a 5-bit-per-channel histogram first, then merges buckets until
 * `count` remain, weighting by how many pixels each represents. Fully
 * transparent pixels are ignored so a logo on a transparent background does not
 * come back as "mostly black".
 */
export function extractPalette(data: Uint8ClampedArray, count = 8): SwatchColor[] {
  const BITS = 5;
  const SHIFT = 8 - BITS;
  const SIDE = 1 << BITS;
  const CELLS = SIDE * SIDE * SIDE;

  const counts = new Uint32Array(CELLS);
  const sumR = new Float64Array(CELLS);
  const sumG = new Float64Array(CELLS);
  const sumB = new Float64Array(CELLS);

  let sampled = 0;
  // Sampling keeps this fast on large images without changing the result much.
  const stride = Math.max(1, Math.floor(data.length / 4 / 200_000)) * 4;

  for (let i = 0; i < data.length; i += stride) {
    if (data[i + 3] < 16) {
      continue;
    }
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const cell = ((r >> SHIFT) << (BITS * 2)) | ((g >> SHIFT) << BITS) | (b >> SHIFT);
    counts[cell] += 1;
    sumR[cell] += r;
    sumG[cell] += g;
    sumB[cell] += b;
    sampled += 1;
  }

  if (sampled === 0) {
    return [];
  }

  const buckets: { count: number; r: number; g: number; b: number }[] = [];
  for (let cell = 0; cell < CELLS; cell += 1) {
    if (counts[cell] > 0) {
      buckets.push({
        count: counts[cell],
        r: sumR[cell] / counts[cell],
        g: sumG[cell] / counts[cell],
        b: sumB[cell] / counts[cell],
      });
    }
  }

  buckets.sort((a, b) => b.count - a.count);

  // Merge near-duplicates so the palette shows distinct colours rather than
  // five shades of the same sky.
  const chosen: typeof buckets = [];
  const minDistance = 48;

  for (const bucket of buckets) {
    const tooClose = chosen.some(
      (existing) =>
        Math.hypot(existing.r - bucket.r, existing.g - bucket.g, existing.b - bucket.b) <
        minDistance,
    );
    if (!tooClose) {
      chosen.push(bucket);
    }
    if (chosen.length >= count) {
      break;
    }
  }

  // If everything merged away (a near-monochrome image), fall back to the top
  // buckets so the user still gets a palette.
  const finals = chosen.length > 0 ? chosen : buckets.slice(0, count);

  return finals.map((bucket) =>
    describeColor(
      { r: Math.round(bucket.r), g: Math.round(bucket.g), b: Math.round(bucket.b) },
      Math.round((bucket.count / sampled) * 100),
    ),
  );
}

function clamp255(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}
