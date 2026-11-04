import { Injectable, inject } from '@angular/core';

import { ImageItem, OutputFormat, ProcessedImage } from '../models/image.models';
import { ImageWorkerService } from './image-worker.service';
import { toProcessedImage } from './processed-image.factory';

export interface ResizeSettings {
  readonly width: number;
  readonly height: number;
  readonly format: OutputFormat;
  readonly quality: number;
  readonly background: string;
}

export interface DimensionPreset {
  readonly label: string;
  readonly description: string;
  readonly width: number;
  readonly height: number;
}

export const DIMENSION_PRESETS: readonly DimensionPreset[] = [
  { label: '1920 × 1080', description: 'Full HD / desktop wallpaper', width: 1920, height: 1080 },
  { label: '1280 × 720', description: 'HD / blog header', width: 1280, height: 720 },
  { label: '1080 × 1080', description: 'Square social post', width: 1080, height: 1080 },
  { label: '1080 × 1350', description: 'Portrait social post', width: 1080, height: 1350 },
  { label: '800 × 600', description: 'Classic 4:3 thumbnail', width: 800, height: 600 },
];

@Injectable({ providedIn: 'root' })
export class ImageResizeService {
  private readonly workers = inject(ImageWorkerService);

  resize(item: ImageItem, settings: ResizeSettings, signal?: AbortSignal): Promise<ProcessedImage> {
    return this.workers
      .process(
        item.file,
        {
          kind: 'resize',
          width: settings.width,
          height: settings.height,
          format: settings.format,
          quality: settings.quality,
          background: settings.background,
        },
        signal,
      )
      .then((output) =>
        toProcessedImage(output, item.baseName, `${output.width}x${output.height}`),
      );
  }

  /** Height that keeps the source aspect ratio for a given width. */
  heightForWidth(width: number, sourceWidth: number, sourceHeight: number): number {
    if (sourceWidth <= 0) {
      return width;
    }
    return Math.max(1, Math.round((width * sourceHeight) / sourceWidth));
  }

  /** Width that keeps the source aspect ratio for a given height. */
  widthForHeight(height: number, sourceWidth: number, sourceHeight: number): number {
    if (sourceHeight <= 0) {
      return height;
    }
    return Math.max(1, Math.round((height * sourceWidth) / sourceHeight));
  }

  scaleBy(
    percent: number,
    sourceWidth: number,
    sourceHeight: number,
  ): { width: number; height: number } {
    const factor = Math.max(1, percent) / 100;
    return {
      width: Math.max(1, Math.round(sourceWidth * factor)),
      height: Math.max(1, Math.round(sourceHeight * factor)),
    };
  }
}
