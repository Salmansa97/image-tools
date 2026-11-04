import { Injectable, inject } from '@angular/core';

import { ImageItem, ProcessedImage, SupportedMimeType } from '../models/image.models';
import { supportsTransparency } from '../utilities/file.utils';
import { ImageWorkerService } from './image-worker.service';
import { toProcessedImage } from './processed-image.factory';

export interface ConversionSettings {
  readonly format: SupportedMimeType;
  readonly quality: number;
  /** Colour painted behind the image when the target format drops alpha. */
  readonly background: string;
}

@Injectable({ providedIn: 'root' })
export class ImageConversionService {
  private readonly workers = inject(ImageWorkerService);

  convert(
    item: ImageItem,
    settings: ConversionSettings,
    signal?: AbortSignal,
  ): Promise<ProcessedImage> {
    return (
      this.workers
        .process(
          item.file,
          {
            kind: 'convert',
            format: settings.format,
            quality: settings.quality,
            background: settings.background,
          },
          signal,
        )
        // No suffix: the new extension already distinguishes the file, so
        // `holiday.png` becomes `holiday.jpg` rather than `holiday-jpeg.jpg`.
        .then((output) => toProcessedImage(output, item.baseName, ''))
    );
  }

  /**
   * True when the conversion will discard an alpha channel, i.e. the source can
   * carry transparency and the target cannot.
   */
  willFlattenTransparency(sourceType: string, target: SupportedMimeType): boolean {
    const sourceCanBeTransparent = sourceType === 'image/png' || sourceType === 'image/webp';
    return sourceCanBeTransparent && !supportsTransparency(target);
  }
}
