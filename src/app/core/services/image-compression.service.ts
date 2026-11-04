import { Injectable, inject } from '@angular/core';

import { ImageItem, OutputFormat, ProcessedImage } from '../models/image.models';
import { ImageWorkerService } from './image-worker.service';
import { toProcessedImage } from './processed-image.factory';

export interface CompressionSettings {
  /** 10–100. */
  readonly quality: number;
  readonly format: OutputFormat;
  /** Longest-edge limit in pixels, or `null` to keep the original dimensions. */
  readonly maxDimension: number | null;
  /** Fill colour applied when the output format has no alpha channel. */
  readonly background: string;
}

export const DEFAULT_COMPRESSION_SETTINGS: CompressionSettings = {
  quality: 75,
  format: 'original',
  maxDimension: null,
  background: '#ffffff',
};

@Injectable({ providedIn: 'root' })
export class ImageCompressionService {
  private readonly workers = inject(ImageWorkerService);

  compress(
    item: ImageItem,
    settings: CompressionSettings,
    signal?: AbortSignal,
  ): Promise<ProcessedImage> {
    return this.workers
      .process(
        item.file,
        {
          kind: 'compress',
          quality: settings.quality,
          format: settings.format,
          maxDimension: settings.maxDimension,
          background: settings.background,
        },
        signal,
      )
      .then((output) => toProcessedImage(output, item.baseName, 'compressed'));
  }
}
