/**
 * Isomorphic image pipeline.
 *
 * Every function here runs unchanged on the main thread and inside a dedicated
 * worker: canvas creation prefers `OffscreenCanvas` and falls back to a DOM
 * canvas, and decoding prefers `createImageBitmap` and falls back to an
 * `HTMLImageElement`. Nothing in this file touches Angular.
 */

import {
  CompressOptions,
  ConvertOptions,
  CropOptions,
  FilterOptions,
  FilterValues,
  FitOptions,
  ProcessOptions,
  ProcessOutput,
  RemoveBackgroundOptions,
  ResizeOptions,
  RotationAngle,
  SupportedMimeType,
  TransformOptions,
  WatermarkOptions,
  WatermarkPosition,
} from '../models/image.models';
import { removeBackground as cutOutBackground, resampleManualMask } from './background-removal';
import { quantize } from './quantize';

type CanvasSurface =
  | {
      readonly kind: 'offscreen';
      readonly canvas: OffscreenCanvas;
      readonly ctx: OffscreenCanvasRenderingContext2D;
    }
  | {
      readonly kind: 'dom';
      readonly canvas: HTMLCanvasElement;
      readonly ctx: CanvasRenderingContext2D;
    };

type Ctx2D = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

interface DecodedImage {
  readonly source: CanvasImageSource;
  readonly width: number;
  readonly height: number;
  readonly release: () => void;
}

/** Hard ceiling on output pixels, to stay inside browser canvas limits. */
const MAX_OUTPUT_PIXELS = 64_000_000;
/** Single-dimension ceiling enforced by most browsers' canvas implementations. */
const MAX_OUTPUT_EDGE = 16_384;

/**
 * Ceiling on *source* pixels, as a decompression-bomb guard.
 *
 * A few hundred kilobytes of PNG can legitimately decode to 60,000 × 60,000
 * pixels — over 14 GB of RGBA — which crashes the tab before any of our own
 * limits apply. Refusing early turns a crash into a message.
 */
const MAX_SOURCE_PIXELS = 120_000_000;

/* -------------------------------------------------------------------------- */
/* Capability detection                                                       */
/* -------------------------------------------------------------------------- */

export function hasOffscreenCanvas(): boolean {
  return (
    typeof OffscreenCanvas !== 'undefined' &&
    typeof OffscreenCanvas.prototype.getContext === 'function'
  );
}

export function hasImageBitmap(): boolean {
  return typeof createImageBitmap === 'function';
}

/** True when this context can run the pipeline at all. */
export function canProcessImages(): boolean {
  return hasOffscreenCanvas() || typeof document !== 'undefined';
}

/* -------------------------------------------------------------------------- */
/* Canvas plumbing                                                            */
/* -------------------------------------------------------------------------- */

function createSurface(width: number, height: number, alpha = true): CanvasSurface {
  const w = clampEdge(width);
  const h = clampEdge(height);

  if (hasOffscreenCanvas()) {
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d', { alpha }) as OffscreenCanvasRenderingContext2D | null;
    if (!ctx) {
      throw new Error('Could not create a 2D drawing context.');
    }
    return { kind: 'offscreen', canvas, ctx };
  }

  if (typeof document === 'undefined') {
    throw new Error('This browser cannot process images: no canvas implementation is available.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { alpha });
  if (!ctx) {
    throw new Error('Could not create a 2D drawing context.');
  }
  return { kind: 'dom', canvas, ctx };
}

function clampEdge(value: number): number {
  const rounded = Math.round(value);
  if (!Number.isFinite(rounded) || rounded < 1) {
    return 1;
  }
  return Math.min(rounded, MAX_OUTPUT_EDGE);
}

/** Frees the backing store of a canvas we are done with. */
function releaseSurface(surface: CanvasSurface): void {
  surface.canvas.width = 0;
  surface.canvas.height = 0;
}

async function surfaceToBlob(
  surface: CanvasSurface,
  type: SupportedMimeType,
  quality: number,
): Promise<Blob> {
  const normalisedQuality = Math.min(1, Math.max(0.01, quality));

  if (surface.kind === 'offscreen') {
    return surface.canvas.convertToBlob({ type, quality: normalisedQuality });
  }

  const canvas = surface.canvas;
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('The browser could not encode this image.')),
      type,
      normalisedQuality,
    );
  });
}

/* -------------------------------------------------------------------------- */
/* Decoding                                                                   */
/* -------------------------------------------------------------------------- */

export async function decodeImage(blob: Blob): Promise<DecodedImage> {
  if (hasImageBitmap()) {
    try {
      const bitmap = await createImageBitmap(blob);
      try {
        guardSourceSize(bitmap.width, bitmap.height);
      } catch (error) {
        bitmap.close();
        throw error;
      }
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch (error) {
      if (error instanceof ImageTooLargeError) {
        throw error;
      }
      // Fall through to the <img> path: some builds of Firefox and Safari
      // refuse `createImageBitmap` for certain progressive JPEGs.
    }
  }

  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    throw new Error('This image could not be decoded by your browser.');
  }

  const url = URL.createObjectURL(blob);
  try {
    const image = await loadImageElement(url);
    guardSourceSize(image.naturalWidth, image.naturalHeight);
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

/** Raised when an image decodes to more pixels than we are willing to hold. */
export class ImageTooLargeError extends Error {
  constructor(width: number, height: number) {
    super(
      `This image is ${width} × ${height} pixels (${((width * height) / 1_000_000).toFixed(
        0,
      )} megapixels), which is too large to process in a browser without running out of memory.`,
    );
    this.name = 'ImageTooLargeError';
  }
}

function guardSourceSize(width: number, height: number): void {
  if (width * height > MAX_SOURCE_PIXELS) {
    throw new ImageTooLargeError(width, height);
  }
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('This file is not a valid image, or it is corrupted.'));
    image.src = url;
  });
}

/** Reads the intrinsic dimensions of a file without keeping the decoded pixels. */
export async function readImageSize(blob: Blob): Promise<{ width: number; height: number }> {
  const decoded = await decodeImage(blob);
  try {
    return { width: decoded.width, height: decoded.height };
  } finally {
    decoded.release();
  }
}

/* -------------------------------------------------------------------------- */
/* Drawing helpers                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Draws `source` into a new surface of the requested size.
 *
 * Downscaling by more than 2× is done in halving steps: a single `drawImage`
 * call to a much smaller size aliases badly, while repeated halving produces
 * results comparable to a proper box filter.
 */
function drawResized(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  background: string | null,
): CanvasSurface {
  let currentSource = source;
  let currentWidth = sourceWidth;
  let currentHeight = sourceHeight;
  let scratch: CanvasSurface | null = null;

  while (currentWidth > targetWidth * 2 && currentHeight > targetHeight * 2) {
    const nextWidth = Math.max(targetWidth, Math.floor(currentWidth / 2));
    const nextHeight = Math.max(targetHeight, Math.floor(currentHeight / 2));
    const step = createSurface(nextWidth, nextHeight, true);
    step.ctx.imageSmoothingEnabled = true;
    step.ctx.imageSmoothingQuality = 'high';
    step.ctx.drawImage(
      currentSource,
      0,
      0,
      currentWidth,
      currentHeight,
      0,
      0,
      nextWidth,
      nextHeight,
    );

    if (scratch) {
      releaseSurface(scratch);
    }
    scratch = step;
    currentSource = step.canvas;
    currentWidth = nextWidth;
    currentHeight = nextHeight;
  }

  const target = createSurface(targetWidth, targetHeight, background === null);
  if (background !== null) {
    target.ctx.fillStyle = background;
    target.ctx.fillRect(0, 0, target.canvas.width, target.canvas.height);
  }
  target.ctx.imageSmoothingEnabled = true;
  target.ctx.imageSmoothingQuality = 'high';
  target.ctx.drawImage(
    currentSource,
    0,
    0,
    currentWidth,
    currentHeight,
    0,
    0,
    target.canvas.width,
    target.canvas.height,
  );

  if (scratch) {
    releaseSurface(scratch);
  }
  return target;
}

/** Bakes rotation and flips into a new surface, returning the transformed size. */
function drawTransformed(
  source: CanvasImageSource,
  width: number,
  height: number,
  rotate: RotationAngle,
  flipH: boolean,
  flipV: boolean,
): CanvasSurface {
  const swapped = rotate === 90 || rotate === 270;
  const outWidth = swapped ? height : width;
  const outHeight = swapped ? width : height;

  const surface = createSurface(outWidth, outHeight, true);
  const ctx = surface.ctx;

  ctx.save();
  ctx.translate(outWidth / 2, outHeight / 2);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.drawImage(source, -width / 2, -height / 2, width, height);
  ctx.restore();

  return surface;
}

/**
 * Bakes a free rotation and flips into a new surface sized to contain the result.
 *
 * Rotating by anything other than a quarter turn makes the image's bounding box
 * grow, so the canvas is sized to that box; otherwise the corners would be cut
 * off. The exposed corners are filled with `background`, or left transparent.
 */
function drawFreeTransform(
  source: CanvasImageSource,
  width: number,
  height: number,
  degrees: number,
  flipH: boolean,
  flipV: boolean,
  background: string | null,
): CanvasSurface {
  const radians = (normaliseAngle(degrees) * Math.PI) / 180;
  const cos = Math.abs(Math.cos(radians));
  const sin = Math.abs(Math.sin(radians));
  const outWidth = Math.round(width * cos + height * sin);
  const outHeight = Math.round(width * sin + height * cos);

  const surface = createSurface(outWidth, outHeight, background === null);
  const ctx = surface.ctx;

  if (background !== null) {
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, surface.canvas.width, surface.canvas.height);
  }

  ctx.save();
  ctx.translate(surface.canvas.width / 2, surface.canvas.height / 2);
  ctx.rotate(radians);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, -width / 2, -height / 2, width, height);
  ctx.restore();

  return surface;
}

function normaliseAngle(degrees: number): number {
  if (!Number.isFinite(degrees)) {
    return 0;
  }
  return ((degrees % 360) + 360) % 360;
}

/** Computes the source rectangle that fills a frame of the requested aspect. */
function coverRect(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): { sx: number; sy: number; sw: number; sh: number } {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  if (sourceRatio > targetRatio) {
    // Source is wider: crop its sides.
    const sw = Math.round(sourceHeight * targetRatio);
    return { sx: Math.round((sourceWidth - sw) / 2), sy: 0, sw, sh: sourceHeight };
  }
  // Source is taller: crop top and bottom.
  const sh = Math.round(sourceWidth / targetRatio);
  return { sx: 0, sy: Math.round((sourceHeight - sh) / 2), sw: sourceWidth, sh };
}

/* -------------------------------------------------------------------------- */
/* Encoding                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Encodes a surface, applying colour quantisation first when the target is PNG.
 *
 * PNG is lossless, so the encoder ignores the quality argument entirely. The only
 * way to make a PNG meaningfully smaller in the browser is to reduce the number of
 * distinct colours, which gives DEFLATE far more to work with.
 */
async function encodeSurface(
  surface: CanvasSurface,
  type: SupportedMimeType,
  quality: number,
): Promise<Blob> {
  if (type === 'image/png') {
    const colours = paletteSizeForQuality(quality);
    if (colours !== null) {
      const { width, height } = surface.canvas;
      const imageData = surface.ctx.getImageData(0, 0, width, height);
      quantize(imageData.data, colours);
      surface.ctx.putImageData(imageData, 0, 0);
    }
  }

  const blob = await surfaceToBlob(surface, type, quality / 100);

  // Safari historically silently fell back to PNG when asked for WebP. Detect it
  // rather than handing the user a mislabelled file.
  if (blob.type && blob.type !== type) {
    throw new Error(
      `Your browser cannot save ${type.replace('image/', '').toUpperCase()} files. Try a different output format.`,
    );
  }

  return blob;
}

/** Maps a 10–100 quality value onto a PNG palette size, or `null` to skip quantisation. */
function paletteSizeForQuality(quality: number): number | null {
  if (quality >= 95) {
    return null;
  }
  const normalised = (Math.min(94, Math.max(10, quality)) - 10) / 84;
  const colours = Math.round(2 ** (4 + normalised * 4));
  return Math.min(256, Math.max(16, colours));
}

/* -------------------------------------------------------------------------- */
/* Operations                                                                 */
/* -------------------------------------------------------------------------- */

export async function processImage(blob: Blob, options: ProcessOptions): Promise<ProcessOutput> {
  if (!canProcessImages()) {
    throw new Error('Image processing is not supported in this browser.');
  }

  const decoded = await decodeImage(blob);
  try {
    switch (options.kind) {
      case 'compress':
        return await runCompress(decoded, blob.type, options);
      case 'resize':
        return await runResize(decoded, blob.type, options);
      case 'convert':
        return await runConvert(decoded, options);
      case 'crop':
        return await runCrop(decoded, blob.type, options);
      case 'transform':
        return await runTransform(decoded, blob.type, options);
      case 'filter':
        return await runFilter(decoded, blob.type, options);
      case 'watermark':
        return await runWatermark(decoded, blob.type, options);
      case 'fit':
        return await runFit(decoded, blob.type, options);
      case 'remove-background':
        return await runRemoveBackground(decoded, blob.type, options);
    }
  } finally {
    decoded.release();
  }
}

function targetType(format: ProcessOptions['format'], sourceType: string): SupportedMimeType {
  if (format !== 'original') {
    return format;
  }
  if (sourceType === 'image/png' || sourceType === 'image/webp' || sourceType === 'image/jpeg') {
    return sourceType;
  }
  return 'image/jpeg';
}

function backgroundFor(type: SupportedMimeType, background: string): string | null {
  // PNG and WebP keep their alpha channel; JPEG must be flattened.
  return type === 'image/jpeg' ? background : null;
}

async function runCompress(
  decoded: DecodedImage,
  sourceType: string,
  options: CompressOptions,
): Promise<ProcessOutput> {
  const type = targetType(options.format, sourceType);
  let { width, height } = decoded;

  if (options.maxDimension && Math.max(width, height) > options.maxDimension) {
    const scale = options.maxDimension / Math.max(width, height);
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  const surface = drawResized(
    decoded.source,
    decoded.width,
    decoded.height,
    width,
    height,
    backgroundFor(type, options.background),
  );

  try {
    const result = await encodeSurface(surface, type, options.quality);
    return { blob: result, type, width: surface.canvas.width, height: surface.canvas.height };
  } finally {
    releaseSurface(surface);
  }
}

async function runResize(
  decoded: DecodedImage,
  sourceType: string,
  options: ResizeOptions,
): Promise<ProcessOutput> {
  const type = targetType(options.format, sourceType);
  const { width, height } = clampToPixelBudget(options.width, options.height);

  const surface = drawResized(
    decoded.source,
    decoded.width,
    decoded.height,
    width,
    height,
    backgroundFor(type, options.background),
  );

  try {
    const result = await encodeSurface(surface, type, options.quality);
    return { blob: result, type, width: surface.canvas.width, height: surface.canvas.height };
  } finally {
    releaseSurface(surface);
  }
}

async function runConvert(decoded: DecodedImage, options: ConvertOptions): Promise<ProcessOutput> {
  const type = options.format;
  const surface = drawResized(
    decoded.source,
    decoded.width,
    decoded.height,
    decoded.width,
    decoded.height,
    backgroundFor(type, options.background),
  );

  try {
    const result = await encodeSurface(surface, type, options.quality);
    return { blob: result, type, width: surface.canvas.width, height: surface.canvas.height };
  } finally {
    releaseSurface(surface);
  }
}

async function runCrop(
  decoded: DecodedImage,
  sourceType: string,
  options: CropOptions,
): Promise<ProcessOutput> {
  const type = targetType(options.format, sourceType);
  const needsTransform = options.rotate !== 0 || options.flipH || options.flipV;

  const transformed = needsTransform
    ? drawTransformed(
        decoded.source,
        decoded.width,
        decoded.height,
        options.rotate,
        options.flipH,
        options.flipV,
      )
    : null;

  const workingSource: CanvasImageSource = transformed ? transformed.canvas : decoded.source;
  const workingWidth = transformed ? transformed.canvas.width : decoded.width;
  const workingHeight = transformed ? transformed.canvas.height : decoded.height;

  // Clamp the crop rectangle so a stale selection can never read outside the bitmap.
  const sx = Math.min(Math.max(0, Math.round(options.sx)), workingWidth - 1);
  const sy = Math.min(Math.max(0, Math.round(options.sy)), workingHeight - 1);
  const sw = Math.min(Math.max(1, Math.round(options.sw)), workingWidth - sx);
  const sh = Math.min(Math.max(1, Math.round(options.sh)), workingHeight - sy);

  const background = backgroundFor(type, options.background);
  const surface = createSurface(sw, sh, background === null);

  try {
    if (background !== null) {
      surface.ctx.fillStyle = background;
      surface.ctx.fillRect(0, 0, surface.canvas.width, surface.canvas.height);
    }
    surface.ctx.imageSmoothingEnabled = true;
    surface.ctx.imageSmoothingQuality = 'high';
    surface.ctx.drawImage(
      workingSource,
      sx,
      sy,
      sw,
      sh,
      0,
      0,
      surface.canvas.width,
      surface.canvas.height,
    );

    const result = await encodeSurface(surface, type, options.quality);
    return { blob: result, type, width: surface.canvas.width, height: surface.canvas.height };
  } finally {
    releaseSurface(surface);
    if (transformed) {
      releaseSurface(transformed);
    }
  }
}

async function runTransform(
  decoded: DecodedImage,
  sourceType: string,
  options: TransformOptions,
): Promise<ProcessOutput> {
  const type = targetType(options.format, sourceType);
  // JPEG has no alpha, so its exposed corners must be filled whatever the user asked.
  const background =
    options.transparentCorners && type !== 'image/jpeg' ? null : options.background;

  const surface = drawFreeTransform(
    decoded.source,
    decoded.width,
    decoded.height,
    options.rotate,
    options.flipH,
    options.flipV,
    background,
  );

  try {
    const result = await encodeSurface(surface, type, options.quality);
    return { blob: result, type, width: surface.canvas.width, height: surface.canvas.height };
  } finally {
    releaseSurface(surface);
  }
}

async function runFilter(
  decoded: DecodedImage,
  sourceType: string,
  options: FilterOptions,
): Promise<ProcessOutput> {
  const type = targetType(options.format, sourceType);
  const background = backgroundFor(type, options.background);

  // Blur samples beyond the image edge, so pad the surface by the blur radius and
  // crop back afterwards; otherwise the border fades to transparent.
  const pad = Math.ceil(Math.max(0, options.filters.blur) * 2);
  const surface = createSurface(decoded.width + pad * 2, decoded.height + pad * 2, true);

  try {
    applyFilters(surface.ctx, options.filters);
    surface.ctx.drawImage(decoded.source, pad, pad, decoded.width, decoded.height);
    surface.ctx.filter = 'none';

    const output = createSurface(decoded.width, decoded.height, background === null);
    try {
      if (background !== null) {
        output.ctx.fillStyle = background;
        output.ctx.fillRect(0, 0, output.canvas.width, output.canvas.height);
      }
      output.ctx.drawImage(
        surface.canvas,
        pad,
        pad,
        decoded.width,
        decoded.height,
        0,
        0,
        output.canvas.width,
        output.canvas.height,
      );

      const result = await encodeSurface(output, type, options.quality);
      return { blob: result, type, width: output.canvas.width, height: output.canvas.height };
    } finally {
      releaseSurface(output);
    }
  } finally {
    releaseSurface(surface);
  }
}

async function runWatermark(
  decoded: DecodedImage,
  sourceType: string,
  options: WatermarkOptions,
): Promise<ProcessOutput> {
  const type = targetType(options.format, sourceType);
  const background = backgroundFor(type, options.background);

  const surface = createSurface(decoded.width, decoded.height, background === null);
  let overlay: DecodedImage | null = null;

  try {
    if (background !== null) {
      surface.ctx.fillStyle = background;
      surface.ctx.fillRect(0, 0, surface.canvas.width, surface.canvas.height);
    }
    surface.ctx.drawImage(decoded.source, 0, 0, decoded.width, decoded.height);

    if (options.mode === 'image' && options.overlay) {
      overlay = await decodeImage(options.overlay);
    }

    drawWatermark(surface, decoded.width, decoded.height, options, overlay);

    const result = await encodeSurface(surface, type, options.quality);
    return { blob: result, type, width: surface.canvas.width, height: surface.canvas.height };
  } finally {
    overlay?.release();
    releaseSurface(surface);
  }
}

async function runFit(
  decoded: DecodedImage,
  sourceType: string,
  options: FitOptions,
): Promise<ProcessOutput> {
  const type = targetType(options.format, sourceType);
  const { width, height } = clampToPixelBudget(options.width, options.height);

  const keepTransparent = options.transparentPadding && type !== 'image/jpeg';
  const background = keepTransparent ? null : options.background;

  const surface = createSurface(width, height, background === null);

  try {
    if (background !== null) {
      surface.ctx.fillStyle = background;
      surface.ctx.fillRect(0, 0, surface.canvas.width, surface.canvas.height);
    }
    surface.ctx.imageSmoothingEnabled = true;
    surface.ctx.imageSmoothingQuality = 'high';

    if (options.fit === 'stretch') {
      surface.ctx.drawImage(decoded.source, 0, 0, width, height);
    } else if (options.fit === 'cover') {
      const { sx, sy, sw, sh } = coverRect(decoded.width, decoded.height, width, height);

      // Lift the crop out first, then downscale it in halving steps. Cropping and
      // scaling in one `drawImage` aliases badly when the source is much larger.
      const cropped = createSurface(sw, sh, true);
      try {
        cropped.ctx.drawImage(decoded.source, sx, sy, sw, sh, 0, 0, sw, sh);
        const scaled = drawResized(cropped.canvas, sw, sh, width, height, null);
        try {
          surface.ctx.drawImage(scaled.canvas, 0, 0, width, height);
        } finally {
          releaseSurface(scaled);
        }
      } finally {
        releaseSurface(cropped);
      }
    } else {
      const scale = Math.min(width / decoded.width, height / decoded.height);
      const drawWidth = Math.max(1, Math.round(decoded.width * scale));
      const drawHeight = Math.max(1, Math.round(decoded.height * scale));
      const scaled = drawResized(
        decoded.source,
        decoded.width,
        decoded.height,
        drawWidth,
        drawHeight,
        null,
      );
      try {
        surface.ctx.drawImage(
          scaled.canvas,
          Math.round((width - drawWidth) / 2),
          Math.round((height - drawHeight) / 2),
          drawWidth,
          drawHeight,
        );
      } finally {
        releaseSurface(scaled);
      }
    }

    const result = await encodeSurface(surface, type, options.quality);
    return { blob: result, type, width: surface.canvas.width, height: surface.canvas.height };
  } finally {
    releaseSurface(surface);
  }
}

/* -------------------------------------------------------------------------- */
/* Filters and watermarks                                                     */
/* -------------------------------------------------------------------------- */

/** Builds the CSS `filter` string for a set of adjustments, or `none`. */
export function filterString(filters: FilterValues): string {
  const parts: string[] = [];
  if (filters.brightness !== 100) parts.push(`brightness(${filters.brightness}%)`);
  if (filters.contrast !== 100) parts.push(`contrast(${filters.contrast}%)`);
  if (filters.saturate !== 100) parts.push(`saturate(${filters.saturate}%)`);
  if (filters.grayscale > 0) parts.push(`grayscale(${filters.grayscale}%)`);
  if (filters.sepia > 0) parts.push(`sepia(${filters.sepia}%)`);
  if (filters.invert > 0) parts.push(`invert(${filters.invert}%)`);
  if (filters.hueRotate !== 0) parts.push(`hue-rotate(${filters.hueRotate}deg)`);
  if (filters.blur > 0) parts.push(`blur(${filters.blur}px)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
}

export function hasNeutralFilters(filters: FilterValues): boolean {
  return filterString(filters) === 'none';
}

function applyFilters(ctx: Ctx2D, filters: FilterValues): void {
  ctx.filter = filterString(filters);
}

/** Where a mark of `width` × `height` sits inside a `w` × `h` image. */
function anchorFor(
  position: WatermarkPosition,
  w: number,
  h: number,
  width: number,
  height: number,
  margin: number,
): { x: number; y: number } {
  const [vertical, horizontal] = position.split('-') as [string, string];

  const x =
    horizontal === 'left'
      ? margin + width / 2
      : horizontal === 'right'
        ? w - margin - width / 2
        : w / 2;

  const y =
    vertical === 'top'
      ? margin + height / 2
      : vertical === 'bottom'
        ? h - margin - height / 2
        : h / 2;

  return { x, y };
}

function drawWatermark(
  surface: CanvasSurface,
  imageWidth: number,
  imageHeight: number,
  options: WatermarkOptions,
  overlay: DecodedImage | null,
): void {
  const ctx = surface.ctx;
  const shortEdge = Math.min(imageWidth, imageHeight);
  const margin = (options.margin / 100) * shortEdge;

  ctx.save();
  ctx.globalAlpha = Math.min(1, Math.max(0, options.opacity / 100));

  if (options.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = Math.max(2, shortEdge * 0.006);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = Math.max(1, shortEdge * 0.003);
  }

  let markWidth: number;
  let markHeight: number;
  let paint: (cx: number, cy: number) => void;

  if (options.mode === 'image' && overlay) {
    markWidth = Math.max(1, (options.imageScale / 100) * imageWidth);
    markHeight = Math.max(1, (markWidth / overlay.width) * overlay.height);
    const source = overlay.source;
    paint = (cx, cy) => {
      ctx.drawImage(source, cx - markWidth / 2, cy - markHeight / 2, markWidth, markHeight);
    };
  } else {
    const fontSize = Math.max(8, (options.fontScale / 100) * shortEdge);
    ctx.font = `600 ${fontSize}px ${options.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = options.color;

    const metrics = ctx.measureText(options.text);
    markWidth = Math.max(1, metrics.width);
    markHeight = fontSize;
    const text = options.text;
    paint = (cx, cy) => {
      ctx.fillText(text, cx, cy);
    };
  }

  const radians = (options.rotation * Math.PI) / 180;

  if (options.tile) {
    // Rotate the whole plane once and tile across a grid large enough to still
    // cover the image after the rotation has turned it.
    const gap = (options.tileGap / 100) * shortEdge;
    const stepX = markWidth + gap;
    const stepY = markHeight + gap;
    const reach = Math.hypot(imageWidth, imageHeight);

    ctx.translate(imageWidth / 2, imageHeight / 2);
    ctx.rotate(radians);

    for (let y = -reach; y <= reach; y += stepY) {
      for (let x = -reach; x <= reach; x += stepX) {
        paint(x, y);
      }
    }
  } else {
    const { x, y } = anchorFor(
      options.position,
      imageWidth,
      imageHeight,
      markWidth,
      markHeight,
      margin,
    );
    ctx.translate(x, y);
    ctx.rotate(radians);
    paint(0, 0);
  }

  ctx.restore();
}

async function runRemoveBackground(
  decoded: DecodedImage,
  sourceType: string,
  options: RemoveBackgroundOptions,
): Promise<ProcessOutput> {
  const opaque = options.background !== 'transparent';
  // Transparency needs a format that can carry it; fall back to PNG rather than
  // silently flattening the cut-out the user just made.
  const type =
    options.format === 'original'
      ? opaque
        ? targetType('original', sourceType)
        : sourceType === 'image/webp'
          ? 'image/webp'
          : 'image/png'
      : options.format;

  const surface = createSurface(decoded.width, decoded.height, true);

  try {
    surface.ctx.drawImage(decoded.source, 0, 0, decoded.width, decoded.height);
    const image = surface.ctx.getImageData(0, 0, surface.canvas.width, surface.canvas.height);

    const manual =
      options.manual && options.manualWidth && options.manualHeight
        ? resampleManualMask(
            options.manual,
            options.manualWidth,
            options.manualHeight,
            image.width,
            image.height,
          )
        : null;

    cutOutBackground(
      image,
      {
        tolerance: options.tolerance,
        edgeSoftness: options.edgeSoftness,
        shrink: options.shrink,
        despill: options.despill,
        mode: options.mode,
        keyColor: options.keyColor,
      },
      manual,
    );

    surface.ctx.putImageData(image, 0, 0);

    // A chosen backdrop is painted underneath, so anti-aliased edges blend into
    // it instead of against whatever the viewer happens to show behind.
    if (opaque || type === 'image/jpeg') {
      const flattened = createSurface(decoded.width, decoded.height, false);
      try {
        flattened.ctx.fillStyle = opaque ? options.background : '#ffffff';
        flattened.ctx.fillRect(0, 0, flattened.canvas.width, flattened.canvas.height);
        flattened.ctx.drawImage(surface.canvas, 0, 0);

        const result = await encodeSurface(flattened, type, options.quality);
        return {
          blob: result,
          type,
          width: flattened.canvas.width,
          height: flattened.canvas.height,
        };
      } finally {
        releaseSurface(flattened);
      }
    }

    const result = await encodeSurface(surface, type, options.quality);
    return { blob: result, type, width: surface.canvas.width, height: surface.canvas.height };
  } finally {
    releaseSurface(surface);
  }
}

/** Scales a requested size down if it would exceed what a canvas can hold. */
function clampToPixelBudget(width: number, height: number): { width: number; height: number } {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const pixels = w * h;
  if (pixels <= MAX_OUTPUT_PIXELS && w <= MAX_OUTPUT_EDGE && h <= MAX_OUTPUT_EDGE) {
    return { width: w, height: h };
  }
  const scale = Math.min(
    Math.sqrt(MAX_OUTPUT_PIXELS / pixels),
    MAX_OUTPUT_EDGE / w,
    MAX_OUTPUT_EDGE / h,
  );
  return {
    width: Math.max(1, Math.floor(w * scale)),
    height: Math.max(1, Math.floor(h * scale)),
  };
}
