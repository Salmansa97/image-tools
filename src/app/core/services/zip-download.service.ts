import { Injectable, inject } from '@angular/core';

import { uniqueName } from '../utilities/file.utils';
import { FileDownloadService } from './file-download.service';

export interface ZipEntry {
  readonly fileName: string;
  readonly blob: Blob;
}

export interface ZipProgress {
  /** 0–100. */
  readonly percent: number;
}

/**
 * Builds a ZIP archive in the browser.
 *
 * JSZip is pulled in with a dynamic import so it only reaches users who actually
 * download a batch, rather than everyone who loads a landing page.
 */
@Injectable({ providedIn: 'root' })
export class ZipDownloadService {
  private readonly downloads = inject(FileDownloadService);

  async createZip(
    entries: readonly ZipEntry[],
    onProgress?: (progress: ZipProgress) => void,
  ): Promise<Blob> {
    if (entries.length === 0) {
      throw new Error('There is nothing to put in the archive yet.');
    }

    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    const taken = new Set<string>();

    for (const entry of entries) {
      zip.file(uniqueName(entry.fileName, taken), entry.blob);
    }

    // Images are already compressed, so STORE keeps zipping fast and the archive
    // the same size DEFLATE would produce.
    return zip.generateAsync({ type: 'blob', compression: 'STORE' }, (metadata) => {
      onProgress?.({ percent: Math.round(metadata.percent) });
    });
  }

  async downloadZip(
    entries: readonly ZipEntry[],
    archiveName: string,
    onProgress?: (progress: ZipProgress) => void,
  ): Promise<void> {
    const blob = await this.createZip(entries, onProgress);
    this.downloads.downloadBlob(
      blob,
      archiveName.endsWith('.zip') ? archiveName : `${archiveName}.zip`,
    );
  }
}
