import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { ImageBatchStore } from '../../core/services/image-batch.store';
import { SeoService } from '../../core/services/seo.service';
import { SingleImageSession } from '../../core/services/single-image-session';
import { UploadHandoffService } from '../../core/services/upload-handoff.service';
import { ImageMetadata, readMetadata } from '../../core/utilities/metadata';
import { toolPageSeo } from '../../seo/tool-page-seo';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
import { FileUploaderComponent } from '../../shared/components/file-uploader/file-uploader.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ToolPageComponent } from '../../shared/components/tool-page/tool-page.component';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { METADATA_CONTENT } from './metadata.content';

@Component({
  selector: 'app-metadata',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ImageBatchStore, SingleImageSession],
  imports: [
    RouterLink,
    ToolPageComponent,
    FileUploaderComponent,
    CopyButtonComponent,
    IconComponent,
    AlertComponent,
    FileSizePipe,
  ],
  templateUrl: './metadata.component.html',
})
export class MetadataComponent {
  private readonly handoff = inject(UploadHandoffService);
  private readonly seo = inject(SeoService);

  protected readonly session = inject(SingleImageSession);
  protected readonly content = METADATA_CONTENT;

  protected readonly item = this.session.item;

  protected readonly metadata = signal<ImageMetadata | null>(null);
  protected readonly reading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly hasAnyMetadata = computed(() => {
    const data = this.metadata();
    return data !== null && (data.hasExif || data.hasXmp || data.hasIcc || data.groups.length > 1);
  });

  /** An OpenStreetMap link rather than an embedded map: no third-party request. */
  protected readonly mapUrl = computed(() => {
    const gps = this.metadata()?.gps;
    if (!gps) {
      return null;
    }
    return `https://www.openstreetmap.org/?mlat=${gps.latitude}&mlon=${gps.longitude}#map=16/${gps.latitude}/${gps.longitude}`;
  });

  /** Everything flattened to text, for pasting into notes or a bug report. */
  protected readonly asText = computed(() => {
    const data = this.metadata();
    if (!data) {
      return '';
    }
    const lines = [`${data.fileName} — ${data.format}, ${data.width} × ${data.height}`];
    for (const group of data.groups) {
      lines.push('', group.name.toUpperCase());
      for (const entry of group.entries) {
        lines.push(`  ${entry.label}: ${entry.value}`);
      }
    }
    return lines.join('\n');
  });

  constructor() {
    this.seo.apply(toolPageSeo(METADATA_CONTENT));

    afterNextRender(() => {
      const staged = this.handoff.claim();
      if (staged.length > 0) {
        void this.addFiles([...staged]);
      }
    });
  }

  protected async addFiles(files: File[]): Promise<void> {
    this.metadata.set(null);
    this.errorMessage.set(null);
    await this.session.load(files);

    const item = this.item();
    if (!item) {
      return;
    }

    this.reading.set(true);
    try {
      this.metadata.set(await readMetadata(item.file));
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'This file could not be inspected.',
      );
    } finally {
      this.reading.set(false);
    }
  }

  protected reset(): void {
    this.session.reset();
    this.metadata.set(null);
    this.errorMessage.set(null);
  }
}
