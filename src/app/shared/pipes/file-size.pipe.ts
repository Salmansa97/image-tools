import { Pipe, PipeTransform } from '@angular/core';

import { formatBytes } from '../../core/utilities/file.utils';

/** `{{ 2621440 | fileSize }}` → `2.50 MB` */
@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number | null | undefined, fractionDigits?: number): string {
    if (bytes === null || bytes === undefined) {
      return '—';
    }
    return formatBytes(bytes, fractionDigits);
  }
}
