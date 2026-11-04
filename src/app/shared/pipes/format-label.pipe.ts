import { Pipe, PipeTransform } from '@angular/core';

import { formatLabel } from '../../core/utilities/file.utils';

/** `{{ 'image/jpeg' | formatLabel }}` → `JPG` */
@Pipe({ name: 'formatLabel' })
export class FormatLabelPipe implements PipeTransform {
  transform(mimeType: string | null | undefined): string {
    return mimeType ? formatLabel(mimeType) : '—';
  }
}
