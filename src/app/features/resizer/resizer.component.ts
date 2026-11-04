import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';

import { OutputFormat } from '../../core/models/image.models';
import { ImageBatchStore } from '../../core/services/image-batch.store';
import { ProcessingHistoryService } from '../../core/services/processing-history.service';
import { SingleImageSession } from '../../core/services/single-image-session';
import { DIMENSION_PRESETS, ImageResizeService } from '../../core/services/image-resize.service';
import { SeoService } from '../../core/services/seo.service';
import { UploadHandoffService } from '../../core/services/upload-handoff.service';
import { toolPageSeo } from '../../seo/tool-page-seo';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { DownloadButtonComponent } from '../../shared/components/download-button/download-button.component';
import { FileUploaderComponent } from '../../shared/components/file-uploader/file-uploader.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ImagePreviewComponent } from '../../shared/components/image-preview/image-preview.component';
import { OptionsPanelComponent } from '../../shared/components/options-panel/options-panel.component';
import { OutputFormatFieldComponent } from '../../shared/components/output-format-field/output-format-field.component';
import { ToolActionButtonComponent } from '../../shared/components/tool-action-button/tool-action-button.component';
import { StatsSummaryComponent } from '../../shared/components/stats-summary/stats-summary.component';
import { ToolPageComponent } from '../../shared/components/tool-page/tool-page.component';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { FormatLabelPipe } from '../../shared/pipes/format-label.pipe';
import { RESIZER_CONTENT } from './resizer.content';

@Component({
  selector: 'app-resizer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ImageBatchStore, SingleImageSession],
  imports: [
    ToolPageComponent,
    FileUploaderComponent,
    OptionsPanelComponent,
    OutputFormatFieldComponent,
    ToolActionButtonComponent,
    ImagePreviewComponent,
    StatsSummaryComponent,
    DownloadButtonComponent,
    IconComponent,
    AlertComponent,
    FileSizePipe,
    FormatLabelPipe,
  ],
  templateUrl: './resizer.component.html',
})
export class ResizerComponent {
  private readonly resizeService = inject(ImageResizeService);
  private readonly handoff = inject(UploadHandoffService);
  private readonly history = inject(ProcessingHistoryService);
  private readonly seo = inject(SeoService);

  protected readonly store = inject(ImageBatchStore);
  protected readonly session = inject(SingleImageSession);
  protected readonly content = RESIZER_CONTENT;
  protected readonly presets = DIMENSION_PRESETS;

  protected readonly width = signal(0);
  protected readonly height = signal(0);
  protected readonly lockRatio = signal(true);
  protected readonly percent = signal(100);
  protected readonly format = signal<string>('original');
  protected readonly quality = signal(85);
  protected readonly background = signal('#ffffff');

  /** The resizer works on a single image, so the first item is always the subject. */
  protected readonly item = this.session.item;
  protected readonly result = this.session.result;
  protected readonly isProcessing = this.session.isProcessing;
  protected readonly isMeasured = this.session.isMeasured;

  protected readonly isUpscaling = computed(() => {
    const item = this.item();
    return item ? this.width() > item.width || this.height() > item.height : false;
  });

  protected readonly canResize = computed(
    () => this.isMeasured() && this.width() >= 1 && this.height() >= 1 && !this.isProcessing(),
  );

  constructor() {
    this.seo.apply(toolPageSeo(RESIZER_CONTENT));

    afterNextRender(() => {
      const staged = this.handoff.claim();
      if (staged.length > 0) {
        void this.addFiles([...staged]);
      }
    });
  }

  protected async addFiles(files: File[]): Promise<void> {
    await this.session.load(files);

    const item = this.item();
    if (item) {
      this.width.set(item.width);
      this.height.set(item.height);
      this.percent.set(100);
    }
  }

  protected setWidth(value: number): void {
    const item = this.item();
    const width = Math.max(1, Math.round(value || 0));
    this.width.set(width);

    if (item && this.lockRatio()) {
      this.height.set(this.resizeService.heightForWidth(width, item.width, item.height));
    }
    this.syncPercentFromWidth();
  }

  protected setHeight(value: number): void {
    const item = this.item();
    const height = Math.max(1, Math.round(value || 0));
    this.height.set(height);

    if (item && this.lockRatio()) {
      this.width.set(this.resizeService.widthForHeight(height, item.width, item.height));
    }
    this.syncPercentFromWidth();
  }

  protected setPercent(value: number): void {
    const item = this.item();
    this.percent.set(value);
    if (!item) {
      return;
    }
    const scaled = this.resizeService.scaleBy(value, item.width, item.height);
    this.width.set(scaled.width);
    this.height.set(scaled.height);
  }

  protected applyPreset(preset: { width: number; height: number }): void {
    this.width.set(preset.width);
    this.height.set(preset.height);
    this.syncPercentFromWidth();
  }

  protected toggleLockRatio(locked: boolean): void {
    this.lockRatio.set(locked);
    if (locked) {
      // Re-derive the height from the current width so the pair is consistent again.
      this.setWidth(this.width());
    }
  }

  protected resetDimensions(): void {
    const item = this.item();
    if (item) {
      this.width.set(item.width);
      this.height.set(item.height);
      this.percent.set(100);
    }
  }

  protected reset(): void {
    this.session.reset();
    this.width.set(0);
    this.height.set(0);
    this.percent.set(100);
    this.format.set('original');
    this.quality.set(85);
  }

  protected async resize(): Promise<void> {
    if (!this.canResize()) {
      return;
    }

    const settings = {
      width: this.width(),
      height: this.height(),
      format: this.format() as OutputFormat,
      quality: this.quality(),
      background: this.background(),
    };

    await this.session.run((item, signal) => this.resizeService.resize(item, settings, signal));

    const item = this.item();
    if (item?.result) {
      void this.history.record({
        toolId: 'resize',
        toolName: 'Image Resizer',
        toolPath: RESIZER_CONTENT.path,
        fileName: item.fileName,
        sourceSize: item.sourceSize,
        resultSize: item.result.size,
        sourceType: item.sourceType,
        resultType: item.result.type,
        width: item.result.width,
        height: item.result.height,
        summary: `Resized to ${item.result.width} × ${item.result.height} px`,
      });
    }
  }

  /** Keeps the percentage slider in step with manually typed dimensions. */
  private syncPercentFromWidth(): void {
    const item = this.item();
    if (!item || item.width === 0) {
      return;
    }
    this.percent.set(Math.round((this.width() / item.width) * 100));
  }
}
