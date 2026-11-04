import { Injectable, inject } from '@angular/core';

import { ImageItem, OutputFormat, ProcessedImage } from '../models/image.models';
import { ImageWorkerService } from './image-worker.service';
import { toProcessedImage } from './processed-image.factory';

export interface TransformSettings {
  /** Clockwise degrees; any angle, not just quarter turns. */
  readonly rotate: number;
  readonly flipH: boolean;
  readonly flipV: boolean;
  readonly format: OutputFormat;
  readonly quality: number;
  readonly background: string;
  readonly transparentCorners: boolean;
}

/** Rotation and mirroring, shared by the rotate and flip tools. */
@Injectable({ providedIn: 'root' })
export class ImageTransformService {
  private readonly workers = inject(ImageWorkerService);

  transform(
    item: ImageItem,
    settings: TransformSettings,
    signal?: AbortSignal,
  ): Promise<ProcessedImage> {
    return this.workers
      .process(
        item.file,
        {
          kind: 'transform',
          rotate: settings.rotate,
          flipH: settings.flipH,
          flipV: settings.flipV,
          format: settings.format,
          quality: settings.quality,
          background: settings.background,
          transparentCorners: settings.transparentCorners,
        },
        signal,
      )
      .then((output) => toProcessedImage(output, item.baseName, this.suffix(settings)));
  }

  /** Describes the transform in the file name, e.g. `photo-rotated-90.jpg`. */
  private suffix(settings: TransformSettings): string {
    const parts: string[] = [];
    if (settings.rotate !== 0) {
      parts.push(`rotated-${Math.round(settings.rotate)}`);
    }
    if (settings.flipH) {
      parts.push('flipped-h');
    }
    if (settings.flipV) {
      parts.push('flipped-v');
    }
    return parts.length > 0 ? parts.join('-') : 'transformed';
  }

  /** Size of the bounding box a rotation produces, used for live previews. */
  rotatedSize(width: number, height: number, degrees: number): { width: number; height: number } {
    const radians = (((degrees % 360) + 360) % 360) * (Math.PI / 180);
    const cos = Math.abs(Math.cos(radians));
    const sin = Math.abs(Math.sin(radians));
    return {
      width: Math.round(width * cos + height * sin),
      height: Math.round(width * sin + height * cos),
    };
  }
}
