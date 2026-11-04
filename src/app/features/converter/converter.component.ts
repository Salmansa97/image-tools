import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';

import { SupportedMimeType } from '../../core/models/image.models';
import { BatchSession } from '../../core/services/batch-session';
import { ImageBatchStore } from '../../core/services/image-batch.store';
import { ImageConversionService } from '../../core/services/image-conversion.service';
import { ProcessingHistoryService } from '../../core/services/processing-history.service';
import { SeoService } from '../../core/services/seo.service';
import { UploadHandoffService } from '../../core/services/upload-handoff.service';
import { formatLabel } from '../../core/utilities/file.utils';
import { toolPageSeo } from '../../seo/tool-page-seo';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { FileUploaderComponent } from '../../shared/components/file-uploader/file-uploader.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ImageCardComponent } from '../../shared/components/image-card/image-card.component';
import { OptionsPanelComponent } from '../../shared/components/options-panel/options-panel.component';
import { OutputFormatFieldComponent } from '../../shared/components/output-format-field/output-format-field.component';
import { ProcessingProgressComponent } from '../../shared/components/processing-progress/processing-progress.component';
import { StatsSummaryComponent } from '../../shared/components/stats-summary/stats-summary.component';
import { ToolActionButtonComponent } from '../../shared/components/tool-action-button/tool-action-button.component';
import { ToolPageComponent } from '../../shared/components/tool-page/tool-page.component';
import { CONVERTER_PRESETS, ConverterPreset } from './converter-pages';

@Component({
  selector: 'app-converter',
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
    ImageCardComponent,
    IconComponent,
    AlertComponent,
  ],
  templateUrl: './converter.component.html',
})
export class ConverterComponent {
  private readonly conversion = inject(ImageConversionService);
  private readonly handoff = inject(UploadHandoffService);
  private readonly history = inject(ProcessingHistoryService);
  private readonly seo = inject(SeoService);

  protected readonly store = inject(ImageBatchStore);
  protected readonly session = inject(BatchSession);

  /** Bound from route data, so one component serves all four conversion pages. */
  readonly presetKey = input<string>('general');

  protected readonly preset = computed<ConverterPreset>(
    () => CONVERTER_PRESETS[this.presetKey()] ?? CONVERTER_PRESETS['general'],
  );

  protected readonly content = computed(() => this.preset().content);

  protected readonly target = signal<string>('image/webp');
  protected readonly quality = signal(85);
  protected readonly background = signal('#ffffff');

  protected readonly targetType = computed(() => this.target() as SupportedMimeType);
  protected readonly targetLabel = computed(() => formatLabel(this.target()));

  /** Images whose alpha channel the selected target cannot keep. */
  protected readonly flattenedItems = computed(() =>
    this.store
      .items()
      .filter((item) =>
        this.conversion.willFlattenTransparency(item.sourceType, this.targetType()),
      ),
  );

  /** Files already in the requested format, where converting is a re-encode. */
  protected readonly alreadyTargetCount = computed(
    () => this.store.items().filter((item) => item.sourceType === this.target()).length,
  );

  constructor() {
    // Route data arrives as an input, so the title and the preselected format are
    // applied whenever the active conversion page changes.
    effect(() => {
      const preset = this.preset();
      this.seo.apply(toolPageSeo(preset.content));
      untracked(() => this.target.set(preset.defaultTarget));
    });

    afterNextRender(() => {
      const staged = this.handoff.claim();
      if (staged.length > 0) {
        void this.session.add([...staged]);
      }
    });
  }

  protected reset(): void {
    this.session.reset();
    this.target.set(this.preset().defaultTarget);
    this.quality.set(85);
  }

  protected async convert(): Promise<void> {
    const settings = {
      format: this.targetType(),
      quality: this.quality(),
      background: this.background(),
    };

    await this.session.run((item, signal) => this.conversion.convert(item, settings, signal));

    for (const item of this.store.completed()) {
      void this.history.record({
        toolId: 'convert',
        toolName: 'Image Converter',
        toolPath: this.content().path,
        fileName: item.fileName,
        sourceSize: item.sourceSize,
        resultSize: item.result?.size ?? 0,
        sourceType: item.sourceType,
        resultType: item.result?.type ?? '',
        width: item.result?.width ?? 0,
        height: item.result?.height ?? 0,
        summary: `Converted to ${this.targetLabel()} at quality ${this.quality()}%`,
      });
    }
  }

  protected downloadZip(): Promise<void> {
    return this.session.downloadZip(`imagetools-${this.targetLabel().toLowerCase()}.zip`);
  }
}
