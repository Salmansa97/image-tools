import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { OutputFormat } from '../../core/models/image.models';
import { BatchSession } from '../../core/services/batch-session';
import { ImageBatchStore } from '../../core/services/image-batch.store';
import { MetadataStripService } from '../../core/services/metadata-strip.service';
import { ProcessingHistoryService } from '../../core/services/processing-history.service';
import { SeoService } from '../../core/services/seo.service';
import { UploadHandoffService } from '../../core/services/upload-handoff.service';
import { toolPageSeo } from '../../seo/tool-page-seo';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { FileUploaderComponent } from '../../shared/components/file-uploader/file-uploader.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ImageCardComponent } from '../../shared/components/image-card/image-card.component';
import { OptionsPanelComponent } from '../../shared/components/options-panel/options-panel.component';
import { OutputFormatFieldComponent } from '../../shared/components/output-format-field/output-format-field.component';
import { ProcessingProgressComponent } from '../../shared/components/processing-progress/processing-progress.component';
import { ToolActionButtonComponent } from '../../shared/components/tool-action-button/tool-action-button.component';
import { ToolPageComponent } from '../../shared/components/tool-page/tool-page.component';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { STRIP_METADATA_CONTENT } from './strip-metadata.content';

interface Scan {
  readonly id: string;
  readonly fileName: string;
  readonly hasExif: boolean;
  readonly hasXmp: boolean;
  readonly hasIcc: boolean;
  readonly hasGps: boolean;
  readonly bytes: number;
}

@Component({
  selector: 'app-strip-metadata',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ImageBatchStore, BatchSession],
  imports: [
    RouterLink,
    ToolPageComponent,
    FileUploaderComponent,
    OptionsPanelComponent,
    OutputFormatFieldComponent,
    ToolActionButtonComponent,
    ProcessingProgressComponent,
    ImageCardComponent,
    IconComponent,
    AlertComponent,
    FileSizePipe,
  ],
  templateUrl: './strip-metadata.component.html',
})
export class StripMetadataComponent {
  private readonly stripService = inject(MetadataStripService);
  private readonly handoff = inject(UploadHandoffService);
  private readonly history = inject(ProcessingHistoryService);
  private readonly seo = inject(SeoService);

  protected readonly store = inject(ImageBatchStore);
  protected readonly session = inject(BatchSession);
  protected readonly content = STRIP_METADATA_CONTENT;

  protected readonly format = signal<string>('original');
  /** High by default: the point is to remove metadata, not to degrade the picture. */
  protected readonly quality = signal(96);
  protected readonly background = signal('#ffffff');

  protected readonly scans = signal<readonly Scan[]>([]);
  protected readonly scanning = signal(false);

  protected readonly withGps = computed(() => this.scans().filter((scan) => scan.hasGps));
  protected readonly withAny = computed(() =>
    this.scans().filter((scan) => scan.hasExif || scan.hasXmp || scan.hasIcc),
  );
  protected readonly totalMetadataBytes = computed(() =>
    this.scans().reduce((total, scan) => total + scan.bytes, 0),
  );

  constructor() {
    this.seo.apply(toolPageSeo(STRIP_METADATA_CONTENT));

    // Scan whenever the set of loaded files changes, so the warnings stay in step.
    effect(() => {
      const items = this.store.items();

      // `scans` is written below, so read it untracked or the effect retriggers itself.
      untracked(() => {
        const known = new Set(this.scans().map((scan) => scan.id));
        const pending = items.filter((item) => !known.has(item.id));

        if (pending.length === 0) {
          // Drop scans for files that have since been removed.
          const live = new Set(items.map((item) => item.id));
          if (this.scans().some((scan) => !live.has(scan.id))) {
            this.scans.update((scans) => scans.filter((scan) => live.has(scan.id)));
          }
          return;
        }

        void this.scan(
          pending.map((item) => ({ id: item.id, file: item.file, name: item.fileName })),
        );
      });
    });

    afterNextRender(() => {
      const staged = this.handoff.claim();
      if (staged.length > 0) {
        void this.session.add([...staged]);
      }
    });
  }

  private async scan(files: readonly { id: string; file: File; name: string }[]): Promise<void> {
    this.scanning.set(true);
    try {
      for (const entry of files) {
        try {
          const data = await this.stripService.inspect(entry.file);
          this.scans.update((scans) => [
            ...scans,
            {
              id: entry.id,
              fileName: entry.name,
              hasExif: data.hasExif,
              hasXmp: data.hasXmp,
              hasIcc: data.hasIcc,
              hasGps: data.gps !== null,
              bytes: data.metadataBytes,
            },
          ]);
        } catch {
          // A file we cannot parse still gets stripped; just show nothing for it.
        }
      }
    } finally {
      this.scanning.set(false);
    }
  }

  protected scanFor(id: string): Scan | undefined {
    return this.scans().find((scan) => scan.id === id);
  }

  protected reset(): void {
    this.session.reset();
    this.scans.set([]);
    this.format.set('original');
    this.quality.set(96);
  }

  protected async strip(): Promise<void> {
    const settings = {
      format: this.format() as OutputFormat,
      quality: this.quality(),
      background: this.background(),
    };

    await this.session.run((item, signal) => this.stripService.strip(item, settings, signal));

    for (const item of this.store.completed()) {
      void this.history.record({
        toolId: 'strip',
        toolName: 'Metadata Remover',
        toolPath: STRIP_METADATA_CONTENT.path,
        fileName: item.fileName,
        sourceSize: item.sourceSize,
        resultSize: item.result?.size ?? 0,
        sourceType: item.sourceType,
        resultType: item.result?.type ?? '',
        width: item.result?.width ?? 0,
        height: item.result?.height ?? 0,
        summary: 'Stripped EXIF, GPS, XMP and colour profile',
      });
    }
  }

  protected downloadZip(): Promise<void> {
    return this.session.downloadZip('imagetools-metadata-removed.zip');
  }
}
