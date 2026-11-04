import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';

import { FilterValues, NEUTRAL_FILTERS, OutputFormat } from '../../core/models/image.models';
import { ImageBatchStore } from '../../core/services/image-batch.store';
import {
  FILTER_PRESETS,
  FilterPreset,
  ImageFilterService,
} from '../../core/services/image-filter.service';
import { ProcessingHistoryService } from '../../core/services/processing-history.service';
import { SeoService } from '../../core/services/seo.service';
import { SingleImageSession } from '../../core/services/single-image-session';
import { UploadHandoffService } from '../../core/services/upload-handoff.service';
import { HistoryStack } from '../../core/utilities/history-stack';
import { toolPageSeo } from '../../seo/tool-page-seo';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { FileUploaderComponent } from '../../shared/components/file-uploader/file-uploader.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { OptionsPanelComponent } from '../../shared/components/options-panel/options-panel.component';
import { OutputFormatFieldComponent } from '../../shared/components/output-format-field/output-format-field.component';
import { SingleImageResultComponent } from '../../shared/components/single-image-result/single-image-result.component';
import { ToolActionButtonComponent } from '../../shared/components/tool-action-button/tool-action-button.component';
import { ToolPageComponent } from '../../shared/components/tool-page/tool-page.component';
import { FILTERS_CONTENT } from './filters.content';

interface SliderSpec {
  readonly key: keyof FilterValues;
  readonly label: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly unit: string;
  readonly neutral: number;
}

const SLIDERS: readonly SliderSpec[] = [
  { key: 'brightness', label: 'Brightness', min: 0, max: 200, step: 1, unit: '%', neutral: 100 },
  { key: 'contrast', label: 'Contrast', min: 0, max: 200, step: 1, unit: '%', neutral: 100 },
  { key: 'saturate', label: 'Saturation', min: 0, max: 300, step: 1, unit: '%', neutral: 100 },
  { key: 'grayscale', label: 'Greyscale', min: 0, max: 100, step: 1, unit: '%', neutral: 0 },
  { key: 'sepia', label: 'Warmth (sepia)', min: 0, max: 100, step: 1, unit: '%', neutral: 0 },
  { key: 'hueRotate', label: 'Hue shift', min: 0, max: 360, step: 1, unit: '°', neutral: 0 },
  { key: 'invert', label: 'Invert', min: 0, max: 100, step: 1, unit: '%', neutral: 0 },
  { key: 'blur', label: 'Blur', min: 0, max: 20, step: 0.1, unit: 'px', neutral: 0 },
];

@Component({
  selector: 'app-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ImageBatchStore, SingleImageSession],
  imports: [
    ToolPageComponent,
    FileUploaderComponent,
    SingleImageResultComponent,
    OptionsPanelComponent,
    OutputFormatFieldComponent,
    ToolActionButtonComponent,
    IconComponent,
    AlertComponent,
  ],
  templateUrl: './filters.component.html',
})
export class FiltersComponent {
  private readonly filterService = inject(ImageFilterService);
  private readonly handoff = inject(UploadHandoffService);
  private readonly history = inject(ProcessingHistoryService);
  private readonly seo = inject(SeoService);

  protected readonly session = inject(SingleImageSession);
  protected readonly content = FILTERS_CONTENT;
  protected readonly sliders = SLIDERS;
  protected readonly presets = FILTER_PRESETS;

  protected readonly item = this.session.item;
  protected readonly result = this.session.result;
  protected readonly isProcessing = this.session.isProcessing;
  protected readonly isMeasured = this.session.isMeasured;

  /**
   * Undo history over the filter values.
   *
   * Live slider movement uses `set` so dragging stays smooth; the step is only
   * committed on release, which keeps one undo per deliberate change rather than
   * sixty per drag.
   */
  private readonly stack = new HistoryStack<FilterValues>(NEUTRAL_FILTERS);

  protected readonly filters = this.stack.value;
  protected readonly canUndo = this.stack.canUndo;
  protected readonly canRedo = this.stack.canRedo;

  protected readonly format = signal<string>('original');
  protected readonly quality = signal(90);
  protected readonly background = signal('#ffffff');
  protected readonly activePreset = signal('original');

  /** The exact string the canvas will use, so preview and export cannot diverge. */
  protected readonly previewFilter = computed(() =>
    this.filterService.previewFilter(this.filters()),
  );

  protected readonly isNeutral = computed(() => this.filterService.isNeutral(this.filters()));

  /** CSS filter for a preset's thumbnail, so the gallery shows the real effect. */
  protected presetFilter(preset: FilterPreset): string {
    return this.filterService.previewFilter(preset.values);
  }

  constructor() {
    this.seo.apply(toolPageSeo(FILTERS_CONTENT));

    afterNextRender(() => {
      const staged = this.handoff.claim();
      if (staged.length > 0) {
        void this.addFiles([...staged]);
      }
    });
  }

  protected async addFiles(files: File[]): Promise<void> {
    await this.session.load(files);
    this.stack.reset(NEUTRAL_FILTERS);
    this.activePreset.set('original');
  }

  protected valueOf(key: keyof FilterValues): number {
    return this.filters()[key];
  }

  /** Live update while dragging — deliberately not an undo step. */
  protected preview(key: keyof FilterValues, value: number): void {
    this.stack.set({ ...this.filters(), [key]: value });
    this.activePreset.set('custom');
  }

  /** Called on release: this is the point worth being able to undo back to. */
  protected commit(key: keyof FilterValues, value: number): void {
    const next = { ...this.filters(), [key]: value };
    // Rewind the live preview to the pre-drag state, then record the finished
    // value as a single step — so undo jumps back over the whole drag, not one
    // slider position at a time.
    this.stack.set(this.lastCommitted);
    this.stack.commit(next);
    this.lastCommitted = next;
    this.session.clearResult();
  }

  /** The value as of the last completed change, i.e. the state a drag started from. */
  private lastCommitted: FilterValues = NEUTRAL_FILTERS;

  protected applyPreset(id: string): void {
    const preset = FILTER_PRESETS.find((entry) => entry.id === id);
    if (!preset) {
      return;
    }
    this.stack.commit(preset.values);
    this.lastCommitted = preset.values;
    this.activePreset.set(id);
    this.session.clearResult();
  }

  protected undo(): void {
    this.stack.undo();
    this.lastCommitted = this.stack.value();
    this.activePreset.set('custom');
    this.session.clearResult();
  }

  protected redo(): void {
    this.stack.redo();
    this.lastCommitted = this.stack.value();
    this.activePreset.set('custom');
    this.session.clearResult();
  }

  protected resetFilters(): void {
    this.stack.commit(NEUTRAL_FILTERS);
    this.lastCommitted = NEUTRAL_FILTERS;
    this.activePreset.set('original');
    this.session.clearResult();
  }

  protected reset(): void {
    this.session.reset();
    this.stack.reset(NEUTRAL_FILTERS);
    this.lastCommitted = NEUTRAL_FILTERS;
    this.activePreset.set('original');
    this.format.set('original');
  }

  protected async apply(): Promise<void> {
    await this.session.run((item, signal) =>
      this.filterService.apply(
        item,
        this.filters(),
        {
          format: this.format() as OutputFormat,
          quality: this.quality(),
          background: this.background(),
        },
        signal,
      ),
    );

    const item = this.item();
    if (item?.result) {
      void this.history.record({
        toolId: 'filters',
        toolName: 'Image Filters',
        toolPath: FILTERS_CONTENT.path,
        fileName: item.fileName,
        sourceSize: item.sourceSize,
        resultSize: item.result.size,
        sourceType: item.sourceType,
        resultType: item.result.type,
        width: item.result.width,
        height: item.result.height,
        summary: this.isNeutral() ? 'Exported without adjustments' : this.previewFilter(),
      });
    }
  }
}
