import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';

import { FitMode, SupportedMimeType } from '../../core/models/image.models';
import { ImageBatchStore } from '../../core/services/image-batch.store';
import { ImageFitService } from '../../core/services/image-fit.service';
import { ProcessingCancelledError } from '../../core/services/image-worker.service';
import { ProcessingHistoryService } from '../../core/services/processing-history.service';
import { SeoService } from '../../core/services/seo.service';
import { SingleImageSession } from '../../core/services/single-image-session';
import {
  SOCIAL_PLATFORMS,
  SOCIAL_PRESETS,
  SocialPreset,
} from '../../core/services/social-preset.service';
import { UploadHandoffService } from '../../core/services/upload-handoff.service';
import { ZipDownloadService } from '../../core/services/zip-download.service';
import { extensionFor, sanitiseFileName } from '../../core/utilities/file.utils';
import { toolPageSeo } from '../../seo/tool-page-seo';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { DownloadButtonComponent } from '../../shared/components/download-button/download-button.component';
import { FileUploaderComponent } from '../../shared/components/file-uploader/file-uploader.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { OptionsPanelComponent } from '../../shared/components/options-panel/options-panel.component';
import { QualitySliderComponent } from '../../shared/components/quality-slider/quality-slider.component';
import {
  SegmentedControlComponent,
  SegmentOption,
} from '../../shared/components/segmented-control/segmented-control.component';
import { ToolActionButtonComponent } from '../../shared/components/tool-action-button/tool-action-button.component';
import { ToolPageComponent } from '../../shared/components/tool-page/tool-page.component';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { SOCIAL_CONTENT } from './social.content';

interface SocialOutput {
  readonly preset: SocialPreset;
  readonly blob: Blob;
  readonly url: string;
  readonly fileName: string;
}

const FIT_OPTIONS: readonly SegmentOption[] = [
  { label: 'Fill', value: 'cover', hint: 'Crop to the exact ratio' },
  { label: 'Fit', value: 'contain', hint: 'Pad so nothing is lost' },
  { label: 'Stretch', value: 'stretch', hint: 'Distort to fit' },
];

const FORMAT_OPTIONS: readonly SegmentOption[] = [
  { label: 'JPG', value: 'image/jpeg' },
  { label: 'PNG', value: 'image/png' },
  { label: 'WebP', value: 'image/webp' },
];

@Component({
  selector: 'app-social',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ImageBatchStore, SingleImageSession],
  imports: [
    ToolPageComponent,
    FileUploaderComponent,
    OptionsPanelComponent,
    SegmentedControlComponent,
    QualitySliderComponent,
    ToolActionButtonComponent,
    DownloadButtonComponent,
    IconComponent,
    AlertComponent,
    FileSizePipe,
  ],
  templateUrl: './social.component.html',
})
export class SocialComponent implements OnDestroy {
  private readonly fitService = inject(ImageFitService);
  private readonly zip = inject(ZipDownloadService);
  private readonly handoff = inject(UploadHandoffService);
  private readonly history = inject(ProcessingHistoryService);
  private readonly seo = inject(SeoService);

  protected readonly session = inject(SingleImageSession);
  protected readonly content = SOCIAL_CONTENT;
  protected readonly platforms = SOCIAL_PLATFORMS;
  protected readonly fitOptions = FIT_OPTIONS;
  protected readonly formatOptions = FORMAT_OPTIONS;

  protected readonly item = this.session.item;
  protected readonly isMeasured = this.session.isMeasured;

  protected readonly selected = signal<readonly string[]>([
    'ig-square',
    'ig-portrait',
    'ig-story',
    'fb-post',
    'x-post',
    'yt-thumb',
  ]);

  protected readonly fit = signal<string>('cover');
  protected readonly format = signal<string>('image/jpeg');
  protected readonly quality = signal(88);
  protected readonly background = signal('#ffffff');
  protected readonly transparentPadding = signal(false);

  protected readonly outputs = signal<readonly SocialOutput[]>([]);
  protected readonly generating = signal(false);
  protected readonly progress = signal(0);
  protected readonly zipping = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private controller: AbortController | null = null;

  protected readonly selectedPresets = computed(() =>
    SOCIAL_PRESETS.filter((preset) => this.selected().includes(preset.id)),
  );

  protected readonly canGenerate = computed(
    () => this.isMeasured() && this.selected().length > 0 && !this.generating(),
  );

  /** Sizes the source cannot fill without upscaling. */
  protected readonly upscaled = computed(() => {
    const item = this.item();
    if (!item || item.width === 0) {
      return [];
    }
    return this.selectedPresets().filter(
      (preset) => preset.width > item.width || preset.height > item.height,
    );
  });

  protected readonly totalSize = computed(() =>
    this.outputs().reduce((total, output) => total + output.blob.size, 0),
  );

  constructor() {
    this.seo.apply(toolPageSeo(SOCIAL_CONTENT));

    afterNextRender(() => {
      const staged = this.handoff.claim();
      if (staged.length > 0) {
        void this.addFiles([...staged]);
      }
    });
  }

  ngOnDestroy(): void {
    this.releaseOutputs();
  }

  protected presetsFor(platform: string): readonly SocialPreset[] {
    return SOCIAL_PRESETS.filter((preset) => preset.platform === platform);
  }

  protected isSelected(id: string): boolean {
    return this.selected().includes(id);
  }

  protected togglePreset(id: string): void {
    this.selected.update((ids) =>
      ids.includes(id) ? ids.filter((entry) => entry !== id) : [...ids, id],
    );
    this.releaseOutputs();
  }

  protected togglePlatform(platform: string): void {
    const ids = this.presetsFor(platform).map((preset) => preset.id);
    const allSelected = ids.every((id) => this.selected().includes(id));

    this.selected.update((current) =>
      allSelected ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])],
    );
    this.releaseOutputs();
  }

  protected isPlatformSelected(platform: string): boolean {
    const ids = this.presetsFor(platform).map((preset) => preset.id);
    return ids.every((id) => this.selected().includes(id));
  }

  protected async addFiles(files: File[]): Promise<void> {
    this.releaseOutputs();
    await this.session.load(files);
  }

  protected reset(): void {
    this.controller?.abort();
    this.controller = null;
    this.releaseOutputs();
    this.session.reset();
  }

  protected cancel(): void {
    this.controller?.abort();
    this.controller = null;
  }

  protected async generate(): Promise<void> {
    const item = this.item();
    if (!item || !this.canGenerate()) {
      return;
    }

    this.releaseOutputs();
    this.errorMessage.set(null);
    this.generating.set(true);
    this.progress.set(0);

    const controller = new AbortController();
    this.controller = controller;

    const presets = this.selectedPresets();
    const type = this.format() as SupportedMimeType;
    const produced: SocialOutput[] = [];

    try {
      for (const [index, preset] of presets.entries()) {
        if (controller.signal.aborted) {
          break;
        }

        const output = await this.fitService.fit(
          item,
          {
            width: preset.width,
            height: preset.height,
            fit: this.fit() as FitMode,
            background: this.background(),
            transparentPadding: this.transparentPadding(),
            format: type,
            quality: this.quality(),
          },
          controller.signal,
        );

        produced.push({
          preset,
          blob: output.blob,
          url: URL.createObjectURL(output.blob),
          // Descriptive rather than numeric, so the ZIP is usable as-is.
          fileName: `${sanitiseFileName(
            `${preset.platform}-${preset.name}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          )}-${preset.width}x${preset.height}.${extensionFor(output.type)}`,
        });

        this.outputs.set([...produced]);
        this.progress.set(Math.round(((index + 1) / presets.length) * 100));
      }

      const item2 = this.item();
      if (item2 && produced.length > 0) {
        void this.history.record({
          toolId: 'social',
          toolName: 'Social Media Resizer',
          toolPath: SOCIAL_CONTENT.path,
          fileName: item2.fileName,
          sourceSize: item2.sourceSize,
          resultSize: produced.reduce((total, output) => total + output.blob.size, 0),
          sourceType: item2.sourceType,
          resultType: type,
          width: Math.max(...produced.map((output) => output.preset.width)),
          height: Math.max(...produced.map((output) => output.preset.height)),
          summary: `Generated ${produced.length} social sizes`,
        });
      }
    } catch (error) {
      if (!(error instanceof ProcessingCancelledError)) {
        this.errorMessage.set(
          error instanceof Error ? error.message : 'The images could not be generated.',
        );
      }
    } finally {
      this.generating.set(false);
      if (this.controller === controller) {
        this.controller = null;
      }
    }
  }

  protected async downloadZip(): Promise<void> {
    const outputs = this.outputs();
    if (outputs.length === 0 || this.zipping()) {
      return;
    }

    this.zipping.set(true);
    this.errorMessage.set(null);

    try {
      await this.zip.downloadZip(
        outputs.map((output) => ({ fileName: output.fileName, blob: output.blob })),
        'imagetools-social-sizes.zip',
      );
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'The ZIP archive could not be created.',
      );
    } finally {
      this.zipping.set(false);
    }
  }

  private releaseOutputs(): void {
    for (const output of this.outputs()) {
      URL.revokeObjectURL(output.url);
    }
    this.outputs.set([]);
    this.progress.set(0);
  }
}
