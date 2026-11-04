import { Injectable, inject } from '@angular/core';

import {
  FilterValues,
  ImageItem,
  NEUTRAL_FILTERS,
  OutputFormat,
  ProcessedImage,
} from '../models/image.models';
import { filterString, hasNeutralFilters } from '../utilities/image-processor';
import { ImageWorkerService } from './image-worker.service';
import { toProcessedImage } from './processed-image.factory';

export interface FilterPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly values: FilterValues;
}

/**
 * Ready-made looks.
 *
 * These are plain filter values rather than anything proprietary, so the live
 * preview (CSS) and the exported file (canvas) are guaranteed to match — they
 * are literally the same filter string.
 */
export const FILTER_PRESETS: readonly FilterPreset[] = [
  {
    id: 'original',
    name: 'Original',
    description: 'No adjustments',
    values: NEUTRAL_FILTERS,
  },
  {
    id: 'vivid',
    name: 'Vivid',
    description: 'Punchier colour and contrast',
    values: { ...NEUTRAL_FILTERS, saturate: 145, contrast: 112, brightness: 103 },
  },
  {
    id: 'soft',
    name: 'Soft',
    description: 'Gentle, lifted shadows',
    values: { ...NEUTRAL_FILTERS, contrast: 90, brightness: 107, saturate: 92 },
  },
  {
    id: 'mono',
    name: 'Mono',
    description: 'Black and white',
    values: { ...NEUTRAL_FILTERS, grayscale: 100, contrast: 110 },
  },
  {
    id: 'noir',
    name: 'Noir',
    description: 'High-contrast monochrome',
    values: { ...NEUTRAL_FILTERS, grayscale: 100, contrast: 145, brightness: 92 },
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Warm, faded film',
    values: { ...NEUTRAL_FILTERS, sepia: 45, saturate: 115, contrast: 95, brightness: 104 },
  },
  {
    id: 'cool',
    name: 'Cool',
    description: 'Shifted towards blue',
    values: { ...NEUTRAL_FILTERS, hueRotate: 180, saturate: 110, brightness: 102 },
  },
  {
    id: 'dreamy',
    name: 'Dreamy',
    description: 'Soft focus and glow',
    values: { ...NEUTRAL_FILTERS, blur: 1.5, brightness: 108, saturate: 115, contrast: 92 },
  },
  {
    id: 'invert',
    name: 'Negative',
    description: 'Inverted colours',
    values: { ...NEUTRAL_FILTERS, invert: 100 },
  },
];

@Injectable({ providedIn: 'root' })
export class ImageFilterService {
  private readonly workers = inject(ImageWorkerService);

  apply(
    item: ImageItem,
    filters: FilterValues,
    output: { format: OutputFormat; quality: number; background: string },
    signal?: AbortSignal,
  ): Promise<ProcessedImage> {
    return this.workers
      .process(
        item.file,
        {
          kind: 'filter',
          filters,
          format: output.format,
          quality: output.quality,
          background: output.background,
        },
        signal,
      )
      .then((result) => toProcessedImage(result, item.baseName, 'filtered'));
  }

  /** The same string the canvas will use, so previews cannot drift from exports. */
  previewFilter(filters: FilterValues): string {
    return filterString(filters);
  }

  isNeutral(filters: FilterValues): boolean {
    return hasNeutralFilters(filters);
  }
}
