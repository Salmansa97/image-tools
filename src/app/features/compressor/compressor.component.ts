import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';

import { OutputFormat } from '../../core/models/image.models';
import { BatchSession } from '../../core/services/batch-session';
import { ImageBatchStore } from '../../core/services/image-batch.store';
import { ImageCompressionService } from '../../core/services/image-compression.service';
import { ProcessingHistoryService } from '../../core/services/processing-history.service';
import { SeoService } from '../../core/services/seo.service';
import { UploadHandoffService } from '../../core/services/upload-handoff.service';
import { resolveOutputFormat } from '../../core/utilities/file.utils';
import { toolPageSeo } from '../../seo/tool-page-seo';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { BeforeAfterComparisonComponent } from '../../shared/components/before-after-comparison/before-after-comparison.component';
import { FileUploaderComponent } from '../../shared/components/file-uploader/file-uploader.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ImageCardComponent } from '../../shared/components/image-card/image-card.component';
import { OptionsPanelComponent } from '../../shared/components/options-panel/options-panel.component';
import { OutputFormatFieldComponent } from '../../shared/components/output-format-field/output-format-field.component';
import { ProcessingProgressComponent } from '../../shared/components/processing-progress/processing-progress.component';
import { StatsSummaryComponent } from '../../shared/components/stats-summary/stats-summary.component';
import { ToolActionButtonComponent } from '../../shared/components/tool-action-button/tool-action-button.component';
import { ToolPageComponent } from '../../shared/components/tool-page/tool-page.component';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { COMPRESSOR_CONTENT } from './compressor.content';

interface DimensionOption {
  readonly label: string;
  readonly value: number | null;
}

const DIMENSION_LIMITS: readonly DimensionOption[] = [
  { label: 'Keep original size', value: null },
  { label: 'Max 3840 px (4K)', value: 3840 },
  { label: 'Max 2560 px', value: 2560 },
  { label: 'Max 1920 px (Full HD)', value: 1920 },
  { label: 'Max 1280 px', value: 1280 },
  { label: 'Max 800 px', value: 800 },
];

@Component({
  selector: 'app-compressor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ImageBatchStore, BatchSession],
  imports: [
    ToolPageComponent,
    FileUploaderComponent,
    OptionsPanelComponent,
    OutputFormatFieldComponent,
    ToolActionButtonComponent,
    ProcessingProgressComponent,
    StatsSummaryComponent,
    BeforeAfterComparisonComponent,
    ImageCardComponent,
    IconComponent,
    AlertComponent,
    FileSizePipe,
  ],
  templateUrl: './compressor.component.html',
})
export class CompressorComponent {
  private readonly compression = inject(ImageCompressionService);
  private readonly handoff = inject(UploadHandoffService);
  private readonly history = inject(ProcessingHistoryService);
  private readonly seo = inject(SeoService);

  protected readonly store = inject(ImageBatchStore);
  protected readonly session = inject(BatchSession);
  protected readonly content = COMPRESSOR_CONTENT;
  protected readonly dimensionLimits = DIMENSION_LIMITS;

  protected readonly quality = signal(75);
  protected readonly format = signal<string>('original');
  protected readonly maxDimension = signal<number | null>(null);
  protected readonly background = signal('#ffffff');
  protected readonly selectedId = signal<string | null>(null);

  /** How many loaded images would lose an alpha channel at the current setting. */
  protected readonly flattenCount = computed(
    () =>
      this.store
        .items()
        .filter(
          (item) =>
            resolveOutputFormat(this.format() as OutputFormat, item.sourceType) === 'image/jpeg' &&
            (item.sourceType === 'image/png' || item.sourceType === 'image/webp'),
        ).length,
  );

  /**
   * The source type handed to the format field. When every image shares a type we
   * pass it through, so the field can explain PNG's lossless quality slider; a
   * mixed batch falls back to JPEG, where the generic wording is correct.
   */
  protected readonly representativeType = computed(() => {
    const items = this.store.items();
    if (items.length === 0) {
      return 'image/jpeg';
    }
    const first = items[0].sourceType;
    return items.every((item) => item.sourceType === first) ? first : 'image/jpeg';
  });

  protected readonly comparison = computed(() => {
    const completed = this.store.completed();
    if (completed.length === 0) {
      return null;
    }
    const selected = completed.find((item) => item.id === this.selectedId()) ?? completed[0];
    return selected.result ? { item: selected, result: selected.result } : null;
  });

  constructor() {
    this.seo.apply(toolPageSeo(COMPRESSOR_CONTENT));

    afterNextRender(() => {
      const staged = this.handoff.claim();
      if (staged.length > 0) {
        void this.session.add([...staged]);
      }
    });
  }

  protected remove(id: string): void {
    this.session.remove(id);
    if (this.selectedId() === id) {
      this.selectedId.set(null);
    }
  }

  protected reset(): void {
    this.session.reset();
    this.selectedId.set(null);
    this.quality.set(75);
    this.format.set('original');
    this.maxDimension.set(null);
  }

  protected async compress(): Promise<void> {
    this.selectedId.set(null);

    const settings = {
      quality: this.quality(),
      format: this.format() as OutputFormat,
      maxDimension: this.maxDimension(),
      background: this.background(),
    };

    await this.session.run((item, signal) => this.compression.compress(item, settings, signal));

    const first = this.store.completed()[0];
    if (first) {
      this.selectedId.set(first.id);
    }

    for (const item of this.store.completed()) {
      void this.history.record({
        toolId: 'compress',
        toolName: 'Image Compressor',
        toolPath: COMPRESSOR_CONTENT.path,
        fileName: item.fileName,
        sourceSize: item.sourceSize,
        resultSize: item.result?.size ?? 0,
        sourceType: item.sourceType,
        resultType: item.result?.type ?? '',
        width: item.result?.width ?? 0,
        height: item.result?.height ?? 0,
        summary: `Quality ${this.quality()}%${
          this.maxDimension() ? `, capped at ${this.maxDimension()} px` : ''
        }`,
      });
    }
  }

  protected downloadZip(): Promise<void> {
    return this.session.downloadZip('imagetools-compressed.zip');
  }
}
