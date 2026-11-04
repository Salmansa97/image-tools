import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';

import { FileDownloadService } from '../../core/services/file-download.service';
import { ImageBatchStore } from '../../core/services/image-batch.store';
import { SeoService } from '../../core/services/seo.service';
import { SingleImageSession } from '../../core/services/single-image-session';
import { UploadHandoffService } from '../../core/services/upload-handoff.service';
import { extensionFor, formatBytes } from '../../core/utilities/file.utils';
import { identify } from '../../core/utilities/sniff';
import { toolPageSeo } from '../../seo/tool-page-seo';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import { FileUploaderComponent } from '../../shared/components/file-uploader/file-uploader.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import {
  SegmentedControlComponent,
  SegmentOption,
} from '../../shared/components/segmented-control/segmented-control.component';
import { ToolPageComponent } from '../../shared/components/tool-page/tool-page.component';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { BASE64_CONTENT } from './base64.content';

const OUTPUT_FORMATS: readonly SegmentOption[] = [
  { label: 'Data URI', value: 'uri' },
  { label: 'CSS', value: 'css' },
  { label: 'HTML', value: 'html' },
  { label: 'JSON', value: 'json' },
];

/** Beyond this, inlining usually costs more than the request it saves. */
const INLINE_ADVICE_LIMIT = 8 * 1024;

@Component({
  selector: 'app-base64',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ImageBatchStore, SingleImageSession],
  imports: [
    ToolPageComponent,
    FileUploaderComponent,
    SegmentedControlComponent,
    CopyButtonComponent,
    IconComponent,
    AlertComponent,
    FileSizePipe,
  ],
  templateUrl: './base64.component.html',
})
export class Base64Component implements OnDestroy {
  private readonly handoff = inject(UploadHandoffService);
  private readonly downloads = inject(FileDownloadService);
  private readonly seo = inject(SeoService);

  protected readonly session = inject(SingleImageSession);
  protected readonly content = BASE64_CONTENT;
  protected readonly outputFormats = OUTPUT_FORMATS;

  protected readonly item = this.session.item;

  protected readonly tab = signal<'encode' | 'decode'>('encode');

  /* ----------------------------- Encoding ----------------------------- */

  protected readonly dataUri = signal<string>('');
  protected readonly encoding = signal(false);
  protected readonly outputFormat = signal<string>('uri');

  protected readonly encodedBytes = computed(() => this.dataUri().length);

  protected readonly overhead = computed(() => {
    const item = this.item();
    if (!item || item.sourceSize === 0 || this.encodedBytes() === 0) {
      return 0;
    }
    return Math.round((this.encodedBytes() / item.sourceSize - 1) * 100);
  });

  protected readonly tooLargeToInline = computed(() => {
    const item = this.item();
    return item !== null && item.sourceSize > INLINE_ADVICE_LIMIT;
  });

  protected readonly output = computed(() => {
    const uri = this.dataUri();
    if (!uri) {
      return '';
    }
    const item = this.item();
    const alt = item ? item.baseName.replace(/"/g, '') : 'Image';

    switch (this.outputFormat()) {
      case 'css':
        return `.element {\n  background-image: url("${uri}");\n  background-size: cover;\n}`;
      case 'html':
        return `<img src="${uri}" alt="${alt}" width="${item?.width ?? 0}" height="${item?.height ?? 0}">`;
      case 'json':
        return JSON.stringify({ name: item?.fileName ?? 'image', dataUri: uri }, null, 2);
      default:
        return uri;
    }
  });

  /* ----------------------------- Decoding ----------------------------- */

  protected readonly decodeInput = signal('');
  protected readonly decodedUrl = signal<string | null>(null);
  protected readonly decodedBlob = signal<Blob | null>(null);
  protected readonly decodeError = signal<string | null>(null);

  protected readonly decodedName = computed(() => {
    const blob = this.decodedBlob();
    if (!blob) {
      return 'decoded-image.png';
    }
    const type = blob.type === 'image/jpeg' || blob.type === 'image/webp' ? blob.type : 'image/png';
    return `decoded-image.${extensionFor(type)}`;
  });

  constructor() {
    this.seo.apply(toolPageSeo(BASE64_CONTENT));

    afterNextRender(() => {
      const staged = this.handoff.claim();
      if (staged.length > 0) {
        void this.addFiles([...staged]);
      }
    });
  }

  ngOnDestroy(): void {
    this.releaseDecoded();
  }

  protected async addFiles(files: File[]): Promise<void> {
    this.dataUri.set('');
    await this.session.load(files);

    const item = this.item();
    if (!item) {
      return;
    }

    this.encoding.set(true);
    try {
      this.dataUri.set(await readAsDataUrl(item.file));
    } catch {
      this.session.errorMessage.set('This file could not be encoded.');
    } finally {
      this.encoding.set(false);
    }
  }

  protected reset(): void {
    this.session.reset();
    this.dataUri.set('');
  }

  protected formatSize(bytes: number): string {
    return formatBytes(bytes);
  }

  /* -------------------------------------------------------------------- */

  /**
   * Decodes a pasted string, tolerating a `data:` prefix, whitespace and
   * URL-safe Base64 — all of which turn up in real stylesheets and API payloads.
   */
  protected decode(): void {
    this.releaseDecoded();
    this.decodeError.set(null);

    const raw = this.decodeInput().trim();
    if (!raw) {
      this.decodeError.set('Paste a Base64 string first.');
      return;
    }

    const payload =
      raw.includes(',') && raw.startsWith('data:') ? raw.slice(raw.indexOf(',') + 1) : raw;
    const normalised = payload.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');

    try {
      const binary = atob(normalised);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }

      // Trust the bytes over any declared type in the prefix.
      const sniffed = identify(bytes);
      if (!sniffed) {
        this.decodeError.set('That decoded successfully, but it is not a recognised image format.');
        return;
      }

      const blob = new Blob([bytes], { type: sniffed });
      this.decodedBlob.set(blob);
      this.decodedUrl.set(URL.createObjectURL(blob));
    } catch {
      this.decodeError.set('That is not valid Base64. Check for missing or extra characters.');
    }
  }

  protected downloadDecoded(): void {
    const blob = this.decodedBlob();
    if (blob) {
      this.downloads.downloadBlob(blob, this.decodedName());
    }
  }

  protected clearDecode(): void {
    this.decodeInput.set('');
    this.releaseDecoded();
    this.decodeError.set(null);
  }

  private releaseDecoded(): void {
    const url = this.decodedUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
    this.decodedUrl.set(null);
    this.decodedBlob.set(null);
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Read failed'));
    reader.readAsDataURL(file);
  });
}
