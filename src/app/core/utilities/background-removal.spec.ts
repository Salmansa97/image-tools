import { describe, expect, it } from 'vitest';

import {
  DEFAULT_REMOVAL_OPTIONS,
  MANUAL_ERASE,
  MANUAL_KEEP,
  RemovalOptions,
  applyManualMask,
  buildMask,
  featherMask,
  removeBackground,
  resampleManualMask,
  transparentShare,
} from './background-removal';

/* -------------------------------------------------------------------------- */
/* Builders                                                                   */
/* -------------------------------------------------------------------------- */

interface Canvas {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

function blank(width: number, height: number, r: number, g: number, b: number): Canvas {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  return { data, width, height };
}

function fillRect(
  canvas: Canvas,
  x0: number,
  y0: number,
  w: number,
  h: number,
  r: number,
  g: number,
  b: number,
): void {
  for (let y = y0; y < y0 + h; y += 1) {
    for (let x = x0; x < x0 + w; x += 1) {
      const i = (y * canvas.width + x) * 4;
      canvas.data[i] = r;
      canvas.data[i + 1] = g;
      canvas.data[i + 2] = b;
      canvas.data[i + 3] = 255;
    }
  }
}

const at = (canvas: Canvas, x: number, y: number) => y * canvas.width + x;

function options(overrides: Partial<RemovalOptions> = {}): RemovalOptions {
  return { ...DEFAULT_REMOVAL_OPTIONS, edgeSoftness: 0, despill: 0, ...overrides };
}

/* -------------------------------------------------------------------------- */

describe('buildMask', () => {
  it('keys a flat background and keeps a contrasting subject', () => {
    const canvas = blank(40, 40, 255, 255, 255);
    fillRect(canvas, 12, 12, 16, 16, 20, 40, 200);

    const { mask } = buildMask(canvas.data, canvas.width, canvas.height, options());

    expect(mask[at(canvas, 1, 1)]).toBe(255); // corner is background
    expect(mask[at(canvas, 20, 20)]).toBe(0); // middle of the subject survives
    expect(mask[at(canvas, 12, 12)]).toBe(0); // subject's own corner survives
  });

  it('leaves an enclosed region alone in contiguous mode', () => {
    // A white "hole" inside the subject is not connected to the border, so a
    // contiguous fill must not reach it.
    const canvas = blank(40, 40, 255, 255, 255);
    fillRect(canvas, 8, 8, 24, 24, 20, 40, 200);
    fillRect(canvas, 18, 18, 4, 4, 255, 255, 255);

    const { mask } = buildMask(canvas.data, canvas.width, canvas.height, options());

    expect(mask[at(canvas, 19, 19)]).toBe(0);
  });

  it('removes that enclosed region in global mode', () => {
    const canvas = blank(40, 40, 255, 255, 255);
    fillRect(canvas, 8, 8, 24, 24, 20, 40, 200);
    fillRect(canvas, 18, 18, 4, 4, 255, 255, 255);

    const { mask } = buildMask(
      canvas.data,
      canvas.width,
      canvas.height,
      options({ mode: 'global' }),
    );

    expect(mask[at(canvas, 19, 19)]).toBe(255);
  });

  it('keeps a subject whose colour merely resembles the background', () => {
    // Mid grey subject on white: distinct enough that a sane tolerance keeps it.
    const canvas = blank(40, 40, 255, 255, 255);
    fillRect(canvas, 12, 12, 16, 16, 150, 150, 150);

    const { mask } = buildMask(
      canvas.data,
      canvas.width,
      canvas.height,
      options({ tolerance: 20 }),
    );

    expect(mask[at(canvas, 20, 20)]).toBe(0);
  });

  it('eats into the subject once the tolerance is absurd', () => {
    const canvas = blank(40, 40, 255, 255, 255);
    fillRect(canvas, 12, 12, 16, 16, 150, 150, 150);

    const { mask } = buildMask(
      canvas.data,
      canvas.width,
      canvas.height,
      options({ tolerance: 100 }),
    );

    expect(mask[at(canvas, 20, 20)]).toBe(255);
  });

  it('follows a smooth gradient background across the frame', () => {
    // A vertical gradient far wider than the tolerance: only the local-growth
    // term can carry the fill from top to bottom.
    const canvas = blank(40, 60, 0, 0, 0);
    for (let y = 0; y < canvas.height; y += 1) {
      const v = Math.round((y / (canvas.height - 1)) * 255);
      for (let x = 0; x < canvas.width; x += 1) {
        const i = (y * canvas.width + x) * 4;
        canvas.data[i] = v;
        canvas.data[i + 1] = v;
        canvas.data[i + 2] = v;
      }
    }
    fillRect(canvas, 14, 24, 12, 12, 220, 30, 30);

    const { mask } = buildMask(
      canvas.data,
      canvas.width,
      canvas.height,
      options({ tolerance: 18 }),
    );

    expect(mask[at(canvas, 2, 2)]).toBe(255);
    expect(mask[at(canvas, 2, 57)]).toBe(255);
    expect(mask[at(canvas, 20, 30)]).toBe(0);
  });

  it('keys an explicit colour rather than sampling the border', () => {
    const canvas = blank(30, 30, 10, 200, 10);
    fillRect(canvas, 10, 10, 10, 10, 200, 30, 30);

    const { mask } = buildMask(
      canvas.data,
      canvas.width,
      canvas.height,
      options({ keyColor: { r: 10, g: 200, b: 10 } }),
    );

    expect(mask[at(canvas, 1, 1)]).toBe(255);
    expect(mask[at(canvas, 15, 15)]).toBe(0);
  });

  it('treats already-transparent pixels as background', () => {
    const canvas = blank(20, 20, 255, 255, 255);
    for (let i = 3; i < canvas.data.length; i += 4) {
      canvas.data[i] = 0;
    }

    const { mask } = buildMask(canvas.data, canvas.width, canvas.height, options());

    expect(Array.from(mask).every((v) => v === 255)).toBe(true);
  });
});

describe('featherMask', () => {
  it('inverts the mask when nothing is asked of it', () => {
    const mask = new Uint8Array([255, 0, 255, 0]);
    const alpha = featherMask(mask, 2, 2, 0, 0);
    expect(Array.from(alpha)).toEqual([0, 255, 0, 255]);
  });

  it('produces intermediate alpha along an edge when feathered', () => {
    const width = 20;
    const height = 20;
    const mask = new Uint8Array(width * height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        mask[y * width + x] = x < 10 ? 255 : 0;
      }
    }

    const alpha = featherMask(mask, width, height, 3, 0);
    const boundary = alpha[10 * width + 10];

    expect(boundary).toBeGreaterThan(0);
    expect(boundary).toBeLessThan(255);
    expect(alpha[10 * width + 1]).toBe(0);
    expect(alpha[10 * width + 18]).toBe(255);
  });

  it('contracts the matte as shrink rises', () => {
    const width = 24;
    const height = 24;
    const mask = new Uint8Array(width * height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        mask[y * width + x] = x < 12 ? 255 : 0;
      }
    }

    const neutral = featherMask(mask, width, height, 3, 0);
    const shrunk = featherMask(mask, width, height, 3, 50);
    const grown = featherMask(mask, width, height, 3, -50);

    const sum = (a: Uint8ClampedArray) => a.reduce((t, v) => t + v, 0);
    expect(sum(shrunk)).toBeLessThan(sum(neutral));
    expect(sum(grown)).toBeGreaterThan(sum(neutral));
  });
});

describe('applyManualMask', () => {
  it('forces painted areas regardless of what the key decided', () => {
    const mask = new Uint8Array([0, 255, 0, 255]);
    const manual = new Uint8Array([MANUAL_ERASE, MANUAL_KEEP, 0, 0]);

    applyManualMask(mask, manual);

    expect(Array.from(mask)).toEqual([255, 0, 0, 255]);
  });
});

describe('resampleManualMask', () => {
  it('returns the same array when the size is unchanged', () => {
    const manual = new Uint8Array([1, 2, 0, 1]);
    expect(resampleManualMask(manual, 2, 2, 2, 2)).toBe(manual);
  });

  it('scales strokes up to the export resolution', () => {
    const manual = new Uint8Array([MANUAL_ERASE, 0, 0, MANUAL_KEEP]);
    const scaled = resampleManualMask(manual, 2, 2, 4, 4);

    expect(scaled.length).toBe(16);
    expect(scaled[0]).toBe(MANUAL_ERASE);
    expect(scaled[15]).toBe(MANUAL_KEEP);
  });
});

describe('removeBackground', () => {
  it('makes the background transparent and leaves the subject opaque', () => {
    const canvas = blank(40, 40, 255, 255, 255);
    fillRect(canvas, 12, 12, 16, 16, 20, 40, 200);
    const image = { data: canvas.data, width: canvas.width, height: canvas.height } as ImageData;

    removeBackground(image, options());

    expect(canvas.data[at(canvas, 1, 1) * 4 + 3]).toBe(0);
    expect(canvas.data[at(canvas, 20, 20) * 4 + 3]).toBe(255);
  });

  it('honours brush overrides', () => {
    const canvas = blank(40, 40, 255, 255, 255);
    fillRect(canvas, 12, 12, 16, 16, 20, 40, 200);
    const image = { data: canvas.data, width: canvas.width, height: canvas.height } as ImageData;

    // Erase a patch of the subject, keep a patch of the background.
    const manual = new Uint8Array(canvas.width * canvas.height);
    manual[at(canvas, 20, 20)] = MANUAL_ERASE;
    manual[at(canvas, 2, 2)] = MANUAL_KEEP;

    removeBackground(image, options(), manual);

    expect(canvas.data[at(canvas, 20, 20) * 4 + 3]).toBe(0);
    expect(canvas.data[at(canvas, 2, 2) * 4 + 3]).toBe(255);
  });

  it('removes the background colour from a solid-colour frame entirely', () => {
    const canvas = blank(16, 16, 0, 177, 64);
    const image = { data: canvas.data, width: canvas.width, height: canvas.height } as ImageData;

    removeBackground(image, options());

    expect(transparentShare(canvas.data)).toBe(100);
  });
});

describe('transparentShare', () => {
  it('reports the proportion of cleared pixels', () => {
    const data = new Uint8ClampedArray(16);
    data[3] = 0;
    data[7] = 0;
    data[11] = 255;
    data[15] = 255;
    expect(transparentShare(data)).toBe(50);
  });
});
