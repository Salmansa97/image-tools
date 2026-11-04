import { Injectable, inject } from '@angular/core';

import { ImageItem, OutputFormat, ProcessedImage } from '../models/image.models';
import {
  ManualValue,
  RemovalOptions,
  Rgb,
  applyAlpha,
  applyManualMask,
  buildMask,
  featherMask,
  transparentShare,
} from '../utilities/background-removal';
import { decodeImage } from '../utilities/image-processor';
import { ImageWorkerService } from './image-worker.service';
import { toProcessedImage } from './processed-image.factory';

/** Longest edge of the interactive preview. */
const PREVIEW_MAX_EDGE = 1400;

export interface PreviewSource {
  /** Pristine pixels at preview resolution; every pass re-reads these. */
  readonly original: ImageData;
  readonly width: number;
  readonly height: number;
  /** Scale from preview back to the source image. */
  readonly scale: number;
}

export interface PreviewResult {
  readonly image: ImageData;
  /** Share of the frame that became transparent, 0–100. */
  readonly removed: number;
}

export interface ExportSettings extends RemovalOptions {
  readonly background: 'transparent' | string;
  readonly format: OutputFormat;
  readonly quality: number;
}

/**
 * Drives the background remover.
 *
 * Interaction and export are deliberately split: the preview runs on the main
 * thread at a bounded resolution so dragging a slider updates in a few
 * milliseconds, while the export re-runs the identical algorithm at full
 * resolution inside a worker. Running the preview through the worker would add
 * a round trip to every slider tick and make the controls feel dead.
 */
@Injectable({ providedIn: 'root' })
export class BackgroundRemovalService {
  private readonly workers = inject(ImageWorkerService);

  /** Decodes the file once into a bounded working copy. */
  async loadPreview(file: Blob): Promise<PreviewSource> {
    const decoded = await decodeImage(file);

    try {
      const scale = Math.min(1, PREVIEW_MAX_EDGE / Math.max(decoded.width, decoded.height));
      const width = Math.max(1, Math.round(decoded.width * scale));
      const height = Math.max(1, Math.round(decoded.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('This browser cannot read image pixels.');
      }

      ctx.drawImage(decoded.source, 0, 0, width, height);
      const original = ctx.getImageData(0, 0, width, height);

      canvas.width = 0;
      canvas.height = 0;

      return { original, width, height, scale: decoded.width / width };
    } finally {
      decoded.release();
    }
  }

  /**
   * Recomputes the matte for the preview.
   *
   * Always starts from the untouched pixels, so repeated passes never compound —
   * de-spill in particular would eat the subject's colour if it were applied to
   * an already de-spilled image.
   */
  preview(
    source: PreviewSource,
    options: RemovalOptions,
    manual: Uint8Array | null,
  ): PreviewResult {
    const image = new ImageData(
      new Uint8ClampedArray(source.original.data),
      source.width,
      source.height,
    );

    const { mask, palette } = buildMask(image.data, image.width, image.height, options);

    if (manual) {
      applyManualMask(mask, manual);
    }

    const alpha = featherMask(
      mask,
      image.width,
      image.height,
      options.edgeSoftness,
      options.shrink,
    );
    applyAlpha(image.data, alpha, palette, options.despill);

    return { image, removed: transparentShare(image.data) };
  }

  /** Runs the same algorithm at full resolution, in a worker. */
  export(
    item: ImageItem,
    settings: ExportSettings,
    manual: Uint8Array | null,
    manualSize: { width: number; height: number } | null,
    signal?: AbortSignal,
  ): Promise<ProcessedImage> {
    return this.workers
      .process(
        item.file,
        {
          kind: 'remove-background',
          tolerance: settings.tolerance,
          edgeSoftness: settings.edgeSoftness,
          shrink: settings.shrink,
          despill: settings.despill,
          mode: settings.mode,
          keyColor: settings.keyColor,
          manual: manual ?? undefined,
          manualWidth: manualSize?.width,
          manualHeight: manualSize?.height,
          background: settings.background,
          format: settings.format,
          quality: settings.quality,
        },
        signal,
      )
      .then((output) =>
        toProcessedImage(
          output,
          item.baseName,
          settings.background === 'transparent' ? 'no-bg' : 'new-bg',
        ),
      );
  }

  /** Reads the colour under a point, for the eyedropper. */
  sampleColour(source: PreviewSource, x: number, y: number): Rgb {
    const px = Math.min(source.width - 1, Math.max(0, Math.round(x)));
    const py = Math.min(source.height - 1, Math.max(0, Math.round(y)));
    const i = (py * source.width + px) * 4;
    const data = source.original.data;
    return { r: data[i], g: data[i + 1], b: data[i + 2] };
  }

  /**
   * Paints a circular brush stroke into the manual mask.
   *
   * Interpolates between the previous and current point so a fast drag leaves a
   * continuous line rather than a trail of dots.
   */
  paint(
    manual: Uint8Array,
    width: number,
    height: number,
    from: { x: number; y: number } | null,
    to: { x: number; y: number },
    radius: number,
    value: ManualValue,
  ): void {
    const start = from ?? to;
    const distance = Math.hypot(to.x - start.x, to.y - start.y);
    const steps = Math.max(1, Math.ceil(distance / Math.max(1, radius * 0.4)));

    for (let step = 0; step <= steps; step += 1) {
      const t = steps === 0 ? 0 : step / steps;
      this.stamp(
        manual,
        width,
        height,
        start.x + (to.x - start.x) * t,
        start.y + (to.y - start.y) * t,
        radius,
        value,
      );
    }
  }

  private stamp(
    manual: Uint8Array,
    width: number,
    height: number,
    cx: number,
    cy: number,
    radius: number,
    value: ManualValue,
  ): void {
    const minX = Math.max(0, Math.floor(cx - radius));
    const maxX = Math.min(width - 1, Math.ceil(cx + radius));
    const minY = Math.max(0, Math.floor(cy - radius));
    const maxY = Math.min(height - 1, Math.ceil(cy + radius));
    const squared = radius * radius;

    for (let y = minY; y <= maxY; y += 1) {
      const dy = y - cy;
      const row = y * width;
      for (let x = minX; x <= maxX; x += 1) {
        const dx = x - cx;
        if (dx * dx + dy * dy <= squared) {
          manual[row + x] = value;
        }
      }
    }
  }
}
