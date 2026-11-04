/**
 * Background removal.
 *
 * Runs entirely on pixel data, so it works unchanged on the main thread (for the
 * interactive preview) and inside the worker (for the full-resolution export).
 *
 * The approach is a region-growing colour key rather than a machine-learning
 * matte: a palette is sampled from the image border, the fill grows inwards
 * while colours stay close to that palette, then the hard mask is feathered
 * into a soft alpha and de-spilled. That gives genuinely clean cut-outs on the images people
 * most often need to cut out — product shots, logos, scans, screenshots, studio
 * portraits — without asking anyone to download a 40 MB model.
 *
 * It is not a general-purpose matte. Hair against a cluttered background needs a
 * trained model, which is why the tool also offers a manual brush: the automatic
 * pass gets you most of the way, and the brush fixes the rest.
 */

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/** Per-pixel manual overrides painted by the user. */
export const MANUAL_NONE = 0;
export const MANUAL_ERASE = 1;
export const MANUAL_KEEP = 2;

export type ManualValue = typeof MANUAL_NONE | typeof MANUAL_ERASE | typeof MANUAL_KEEP;

export interface RemovalOptions {
  /** 0–100. How far a colour may drift from the background and still be keyed. */
  readonly tolerance: number;
  /** Feather radius in pixels. */
  readonly edgeSoftness: number;
  /** −100…100. Negative grows the subject, positive eats into it. */
  readonly shrink: number;
  /** 0–100. Removes background colour bleeding into semi-transparent edges. */
  readonly despill: number;
  /**
   * `contiguous` only removes background connected to the border — the safe
   * default. `global` keys every matching colour anywhere in the frame, which
   * is what you want for a logo sitting on a flat field.
   */
  readonly mode: 'contiguous' | 'global';
  /** Key this colour instead of sampling the border. */
  readonly keyColor: Rgb | null;
}

export const DEFAULT_REMOVAL_OPTIONS: RemovalOptions = {
  tolerance: 28,
  edgeSoftness: 2,
  shrink: 0,
  despill: 60,
  mode: 'contiguous',
  keyColor: null,
};

/* -------------------------------------------------------------------------- */
/* Colour distance                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Weighted RGB ("redmean") distance.
 *
 * A far better match for human perception than plain Euclidean RGB, and a
 * fraction of the cost of converting every pixel to Lab. Range is 0…765.
 */
function colourDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  const rmean = (r1 + r2) * 0.5;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt((2 + rmean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rmean) / 256) * db * db);
}

/* -------------------------------------------------------------------------- */
/* Background palette                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Collects the handful of colours the border is actually made of.
 *
 * A single average would be useless on a two-tone or gradient backdrop, so
 * border pixels are binned at 4 bits per channel and the most populated bins
 * become the palette. Matching against several colours is what lets a gradient
 * sky or a vignetted studio sweep key cleanly.
 */
function samplePalette(data: Uint8ClampedArray, width: number, height: number): Rgb[] {
  const bins = new Map<number, { count: number; r: number; g: number; b: number }>();

  const add = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    if (data[i + 3] < 8) {
      return;
    }
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const bin = bins.get(key);
    if (bin) {
      bin.count += 1;
      bin.r += r;
      bin.g += g;
      bin.b += b;
    } else {
      bins.set(key, { count: 1, r, g, b });
    }
  };

  for (let x = 0; x < width; x += 1) {
    add(x, 0);
    add(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    add(0, y);
    add(width - 1, y);
  }

  const total = Array.from(bins.values()).reduce((sum, bin) => sum + bin.count, 0);
  if (total === 0) {
    return [{ r: 255, g: 255, b: 255 }];
  }

  return (
    Array.from(bins.values())
      .sort((a, b) => b.count - a.count)
      // Ignore bins that are almost certainly subject poking into the frame edge.
      .filter((bin) => bin.count / total > 0.02)
      .slice(0, 8)
      .map((bin) => ({
        r: Math.round(bin.r / bin.count),
        g: Math.round(bin.g / bin.count),
        b: Math.round(bin.b / bin.count),
      }))
  );
}

function nearestPaletteDistance(
  palette: readonly Rgb[],
  r: number,
  g: number,
  b: number,
): { distance: number; colour: Rgb } {
  let best = Number.POSITIVE_INFINITY;
  let colour = palette[0];

  for (const entry of palette) {
    const d = colourDistance(r, g, b, entry.r, entry.g, entry.b);
    if (d < best) {
      best = d;
      colour = entry;
    }
  }

  return { distance: best, colour };
}

/* -------------------------------------------------------------------------- */
/* Mask construction                                                          */
/* -------------------------------------------------------------------------- */

export interface MaskResult {
  /** 255 = background, 0 = subject. */
  readonly mask: Uint8Array;
  readonly palette: readonly Rgb[];
}

/**
 * Builds the hard background mask.
 *
 * In `contiguous` mode this is a flood fill seeded from every border pixel that
 * matches the palette, growing only into pixels that also match the palette.
 *
 * Growth is deliberately *not* allowed to chain from neighbour to neighbour.
 * An earlier version let a pixel join if it merely resembled the pixel it
 * spread from, to carry smooth gradients — but an anti-aliased edge is also a
 * smooth gradient, so at the shallow top and bottom of a curve the fill walked
 * straight through the rim and ate the subject. Gradient backdrops are handled
 * instead by the palette, which samples the whole border and so already
 * contains both ends of the gradient.
 */
export function buildMask(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: RemovalOptions,
): MaskResult {
  const palette = options.keyColor ? [options.keyColor] : samplePalette(data, width, height);
  const threshold = (options.tolerance / 100) * 360;

  const mask = new Uint8Array(width * height);

  // Pixels that are already transparent are background by definition.
  for (let p = 0, i = 3; p < mask.length; p += 1, i += 4) {
    if (data[i] < 8) {
      mask[p] = 255;
    }
  }

  if (options.mode === 'global') {
    for (let p = 0, i = 0; p < mask.length; p += 1, i += 4) {
      if (mask[p] === 255) {
        continue;
      }
      const { distance } = nearestPaletteDistance(palette, data[i], data[i + 1], data[i + 2]);
      if (distance <= threshold) {
        mask[p] = 255;
      }
    }
    return { mask, palette };
  }

  // Flood fill inwards from the border.
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  const visit = (p: number): void => {
    if (mask[p] === 255) {
      return;
    }
    const i = p * 4;
    const { distance } = nearestPaletteDistance(palette, data[i], data[i + 1], data[i + 2]);
    if (distance <= threshold) {
      mask[p] = 255;
      queue[tail] = p;
      tail += 1;
    }
  };

  for (let x = 0; x < width; x += 1) {
    visit(x);
    visit((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    visit(y * width);
    visit(y * width + width - 1);
  }

  while (head < tail) {
    const p = queue[head];
    head += 1;

    const x = p % width;
    const y = (p / width) | 0;

    if (x > 0) visit(p - 1);
    if (x < width - 1) visit(p + 1);
    if (y > 0) visit(p - width);
    if (y < height - 1) visit(p + width);
  }

  return { mask, palette };
}

/* -------------------------------------------------------------------------- */
/* Feathering                                                                 */
/* -------------------------------------------------------------------------- */

/** Horizontal + vertical box blur. Three passes approximate a Gaussian well. */
function boxBlur(
  source: Float32Array,
  target: Float32Array,
  width: number,
  height: number,
  radius: number,
): void {
  const window = radius * 2 + 1;

  // Horizontal
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    let sum = 0;
    for (let x = -radius; x <= radius; x += 1) {
      sum += source[row + Math.min(width - 1, Math.max(0, x))];
    }
    for (let x = 0; x < width; x += 1) {
      target[row + x] = sum / window;
      const out = row + Math.min(width - 1, Math.max(0, x - radius));
      const into = row + Math.min(width - 1, Math.max(0, x + radius + 1));
      sum += source[into] - source[out];
    }
  }

  // Vertical
  for (let x = 0; x < width; x += 1) {
    let sum = 0;
    for (let y = -radius; y <= radius; y += 1) {
      sum += target[Math.min(height - 1, Math.max(0, y)) * width + x];
    }
    for (let y = 0; y < height; y += 1) {
      source[y * width + x] = sum / window;
      const out = Math.min(height - 1, Math.max(0, y - radius)) * width + x;
      const into = Math.min(height - 1, Math.max(0, y + radius + 1)) * width + x;
      sum += target[into] - target[out];
    }
  }
}

/**
 * Turns the hard mask into a soft alpha channel.
 *
 * Blurring the binary mask and then remapping the result is what produces an
 * anti-aliased edge; `shrink` slides the remap window, which contracts or
 * expands the matte by a sub-pixel amount rather than by whole pixels.
 */
export function featherMask(
  mask: Uint8Array,
  width: number,
  height: number,
  radius: number,
  shrink: number,
): Uint8ClampedArray {
  const alpha = new Uint8ClampedArray(mask.length);

  if (radius <= 0 && shrink === 0) {
    for (let p = 0; p < mask.length; p += 1) {
      alpha[p] = 255 - mask[p];
    }
    return alpha;
  }

  const buffer = new Float32Array(mask.length);
  const scratch = new Float32Array(mask.length);
  for (let p = 0; p < mask.length; p += 1) {
    buffer[p] = mask[p];
  }

  // Three box passes spread roughly three times the box radius, so divide the
  // requested width by three. Without this, "3 px" of softness would actually
  // feather across nine, and the slider would not mean what it says.
  const r = Math.max(1, Math.round(radius / 3));
  for (let pass = 0; pass < 3; pass += 1) {
    boxBlur(buffer, scratch, width, height, r);
  }

  // Sliding the remap window contracts (bias > 0) or expands (bias < 0) the
  // matte by a sub-pixel amount, rather than eroding whole pixels.
  const bias = (shrink / 100) * 0.45;
  const lo = Math.max(0, bias);
  const hi = Math.min(1, 1 + bias);
  const span = Math.max(0.001, hi - lo);

  for (let p = 0; p < mask.length; p += 1) {
    const background = buffer[p] / 255;
    const foreground = 1 - background;
    alpha[p] = Math.round(Math.min(1, Math.max(0, (foreground - lo) / span)) * 255);
  }

  return alpha;
}

/* -------------------------------------------------------------------------- */
/* Composite                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Writes the alpha into the image and removes background spill.
 *
 * A semi-transparent edge pixel is a blend of subject and background, so it
 * carries the backdrop's colour — the green fringe you get from a green screen.
 * Un-premultiplying against the keyed colour recovers the subject's true colour
 * and is the difference between a cut-out that looks placed and one that looks
 * pasted.
 */
export function applyAlpha(
  data: Uint8ClampedArray,
  alpha: Uint8ClampedArray,
  palette: readonly Rgb[],
  despill: number,
): void {
  const strength = Math.min(1, Math.max(0, despill / 100));

  for (let p = 0, i = 0; p < alpha.length; p += 1, i += 4) {
    const a = alpha[p];

    if (a === 0) {
      data[i + 3] = 0;
      continue;
    }

    if (a < 250 && strength > 0) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const { colour } = nearestPaletteDistance(palette, r, g, b);

      const fraction = a / 255;
      // Guard the divide: below ~12% coverage the estimate is pure noise.
      if (fraction > 0.12) {
        const unmixed = (channel: number, bg: number) => (channel - (1 - fraction) * bg) / fraction;
        data[i] = r + (unmixed(r, colour.r) - r) * strength;
        data[i + 1] = g + (unmixed(g, colour.g) - g) * strength;
        data[i + 2] = b + (unmixed(b, colour.b) - b) * strength;
      }
    }

    data[i + 3] = a;
  }
}

/* -------------------------------------------------------------------------- */
/* Manual overrides                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Folds the user's brush strokes into the mask.
 *
 * Painted areas are absolute: an erased region is background no matter what the
 * colour key decided, and a kept region survives even if it matches the backdrop
 * exactly. That is what makes the tool usable on images the automatic pass
 * cannot solve on its own.
 */
export function applyManualMask(mask: Uint8Array, manual: Uint8Array): void {
  for (let p = 0; p < mask.length; p += 1) {
    const override = manual[p];
    if (override === MANUAL_ERASE) {
      mask[p] = 255;
    } else if (override === MANUAL_KEEP) {
      mask[p] = 0;
    }
  }
}

/**
 * Scales a manual mask to a different resolution with nearest-neighbour
 * sampling, so strokes painted on the interactive preview apply to the
 * full-resolution export.
 */
export function resampleManualMask(
  manual: Uint8Array,
  fromWidth: number,
  fromHeight: number,
  toWidth: number,
  toHeight: number,
): Uint8Array {
  if (fromWidth === toWidth && fromHeight === toHeight) {
    return manual;
  }

  const out = new Uint8Array(toWidth * toHeight);
  const xRatio = fromWidth / toWidth;
  const yRatio = fromHeight / toHeight;

  for (let y = 0; y < toHeight; y += 1) {
    const sourceY = Math.min(fromHeight - 1, (y * yRatio) | 0);
    const sourceRow = sourceY * fromWidth;
    const targetRow = y * toWidth;
    for (let x = 0; x < toWidth; x += 1) {
      out[targetRow + x] = manual[sourceRow + Math.min(fromWidth - 1, (x * xRatio) | 0)];
    }
  }

  return out;
}

/** Runs the whole pipeline over an `ImageData` in place. */
export function removeBackground(
  image: ImageData,
  options: RemovalOptions,
  manual?: Uint8Array | null,
): void {
  const { width, height, data } = image;
  const { mask, palette } = buildMask(data, width, height, options);

  if (manual && manual.length === mask.length) {
    applyManualMask(mask, manual);
  }

  const alpha = featherMask(mask, width, height, options.edgeSoftness, options.shrink);
  applyAlpha(data, alpha, palette, options.despill);
}

/** Share of pixels that ended up transparent, for the UI to report. */
export function transparentShare(data: Uint8ClampedArray): number {
  let clear = 0;
  const total = data.length / 4;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 16) {
      clear += 1;
    }
  }
  return total === 0 ? 0 : Math.round((clear / total) * 100);
}
