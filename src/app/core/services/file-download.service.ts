import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/** Triggers browser downloads for blobs produced entirely on the client. */
@Injectable({ providedIn: 'root' })
export class FileDownloadService {
  private readonly document = inject(DOCUMENT);

  /** Downloads a blob under `fileName`, cleaning up the temporary URL afterwards. */
  downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    try {
      this.downloadUrl(url, fileName);
    } finally {
      // Give the browser a tick to start the transfer before releasing the URL.
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    }
  }

  /** Downloads an existing object URL without taking ownership of it. */
  downloadUrl(url: string, fileName: string): void {
    const anchor = this.document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    this.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }
}
