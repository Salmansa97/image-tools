import { Injectable, inject } from '@angular/core';

import { FitMode, ImageItem, OutputFormat, ProcessOutput } from '../models/image.models';
import { ImageWorkerService } from './image-worker.service';

export interface FitSettings {
  readonly width: number;
  readonly height: number;
  readonly fit: FitMode;
  readonly background: string;
  readonly transparentPadding: boolean;
  readonly format: OutputFormat;
  readonly quality: number;
}

/**
 * Renders an image into an exact frame.
 *
 * Shared by the social-media resizer and the favicon generator, which both need
 * "one source, many fixed sizes" and differ only in the size list.
 */
@Injectable({ providedIn: 'root' })
export class ImageFitService {
  private readonly workers = inject(ImageWorkerService);

  fit(item: ImageItem, settings: FitSettings, signal?: AbortSignal): Promise<ProcessOutput> {
    return this.workers.process(
      item.file,
      {
        kind: 'fit',
        width: settings.width,
        height: settings.height,
        fit: settings.fit,
        background: settings.background,
        transparentPadding: settings.transparentPadding,
        format: settings.format,
        quality: settings.quality,
      },
      signal,
    );
  }
}
