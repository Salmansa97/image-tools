import { Injectable, inject } from '@angular/core';

import { ImageItem, OutputFormat, ProcessedImage } from '../models/image.models';
import { ImageMetadata, readMetadata } from '../utilities/metadata';
import { ImageWorkerService } from './image-worker.service';
import { toProcessedImage } from './processed-image.factory';

export interface StripSettings {
  readonly format: OutputFormat;
  readonly quality: number;
  readonly background: string;
}

/**
 * Removes every metadata block from an image.
 *
 * Implemented as a decode-and-re-encode rather than as surgery on the container.
 * Rebuilding the file from its pixels means there is physically nowhere for EXIF,
 * XMP, IPTC, maker notes or embedded thumbnails to survive — which is a stronger
 * guarantee than deleting the specific blocks a parser happens to recognise.
 */
@Injectable({ providedIn: 'root' })
export class MetadataStripService {
  private readonly workers = inject(ImageWorkerService);

  strip(item: ImageItem, settings: StripSettings, signal?: AbortSignal): Promise<ProcessedImage> {
    return this.workers
      .process(
        item.file,
        {
          kind: 'convert',
          // `convert` re-encodes at full size, which is exactly the operation needed.
          format: resolveStripFormat(settings.format, item.sourceType),
          quality: settings.quality,
          background: settings.background,
        },
        signal,
      )
      .then((output) => toProcessedImage(output, item.baseName, 'clean'));
  }

  /** Reads what a file is carrying, so the UI can show what will be removed. */
  inspect(file: File): Promise<ImageMetadata> {
    return readMetadata(file);
  }
}

function resolveStripFormat(
  format: OutputFormat,
  sourceType: string,
): 'image/jpeg' | 'image/png' | 'image/webp' {
  if (format !== 'original') {
    return format;
  }
  if (sourceType === 'image/png' || sourceType === 'image/webp' || sourceType === 'image/jpeg') {
    return sourceType;
  }
  return 'image/jpeg';
}
