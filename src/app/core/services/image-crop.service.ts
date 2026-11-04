import { Injectable, inject } from '@angular/core';

import { ImageItem, OutputFormat, ProcessedImage, RotationAngle } from '../models/image.models';
import { ImageWorkerService } from './image-worker.service';
import { toProcessedImage } from './processed-image.factory';

/** A rectangle in post-transform (rotated/flipped) image pixels. */
export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropSettings {
  readonly rect: CropRect;
  readonly rotate: RotationAngle;
  readonly flipH: boolean;
  readonly flipV: boolean;
  readonly format: OutputFormat;
  readonly quality: number;
  readonly background: string;
}

export interface AspectRatioOption {
  readonly label: string;
  /** `null` means a free-form selection. */
  readonly ratio: number | null;
}

export const ASPECT_RATIOS: readonly AspectRatioOption[] = [
  { label: 'Free', ratio: null },
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '3:2', ratio: 3 / 2 },
  { label: '9:16', ratio: 9 / 16 },
];

@Injectable({ providedIn: 'root' })
export class ImageCropService {
  private readonly workers = inject(ImageWorkerService);

  crop(item: ImageItem, settings: CropSettings, signal?: AbortSignal): Promise<ProcessedImage> {
    return this.workers
      .process(
        item.file,
        {
          kind: 'crop',
          sx: settings.rect.x,
          sy: settings.rect.y,
          sw: settings.rect.width,
          sh: settings.rect.height,
          rotate: settings.rotate,
          flipH: settings.flipH,
          flipV: settings.flipV,
          format: settings.format,
          quality: settings.quality,
          background: settings.background,
        },
        signal,
      )
      .then((output) => toProcessedImage(output, item.baseName, 'cropped'));
  }

  /** Size of the image once rotation has been applied. */
  transformedSize(
    width: number,
    height: number,
    rotate: RotationAngle,
  ): { width: number; height: number } {
    return rotate === 90 || rotate === 270 ? { width: height, height: width } : { width, height };
  }

  /** The largest centred rectangle of `ratio` that fits inside the given bounds. */
  centredRect(boundsWidth: number, boundsHeight: number, ratio: number | null): CropRect {
    if (ratio === null) {
      return { x: 0, y: 0, width: boundsWidth, height: boundsHeight };
    }

    let width = boundsWidth;
    let height = width / ratio;

    if (height > boundsHeight) {
      height = boundsHeight;
      width = height * ratio;
    }

    return {
      x: Math.round((boundsWidth - width) / 2),
      y: Math.round((boundsHeight - height) / 2),
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  /** Keeps a rectangle fully inside the image, preserving its size where possible. */
  clampRect(rect: CropRect, boundsWidth: number, boundsHeight: number): CropRect {
    const width = Math.min(Math.max(1, Math.round(rect.width)), boundsWidth);
    const height = Math.min(Math.max(1, Math.round(rect.height)), boundsHeight);
    return {
      width,
      height,
      x: Math.min(Math.max(0, Math.round(rect.x)), boundsWidth - width),
      y: Math.min(Math.max(0, Math.round(rect.y)), boundsHeight - height),
    };
  }
}
