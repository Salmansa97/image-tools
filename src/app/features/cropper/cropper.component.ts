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

import { OutputFormat, RotationAngle } from '../../core/models/image.models';
import { ImageBatchStore } from '../../core/services/image-batch.store';
import { ASPECT_RATIOS, CropRect, ImageCropService } from '../../core/services/image-crop.service';
import { ProcessingHistoryService } from '../../core/services/processing-history.service';
import { SeoService } from '../../core/services/seo.service';
import { SingleImageSession } from '../../core/services/single-image-session';
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
import { ToolPageComponent } from '../../shared/components/tool-page/tool-page.component';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { FormatLabelPipe } from '../../shared/pipes/format-label.pipe';
import { CropStageComponent } from './crop-stage.component';
import { CROPPER_CONTENT } from './cropper.content';

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

@Component({
  selector: 'app-cropper',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ImageBatchStore, SingleImageSession],
  imports: [
    ToolPageComponent,
    CropStageComponent,
    FileUploaderComponent,
    OptionsPanelComponent,
    OutputFormatFieldComponent,
    ToolActionButtonComponent,
    ImagePreviewComponent,
    DownloadButtonComponent,
    IconComponent,
    AlertComponent,
    FileSizePipe,
    FormatLabelPipe,
  ],
  templateUrl: './cropper.component.html',
})
export class CropperComponent {
  private readonly cropService = inject(ImageCropService);
  private readonly handoff = inject(UploadHandoffService);
  private readonly history = inject(ProcessingHistoryService);
  private readonly seo = inject(SeoService);

  protected readonly store = inject(ImageBatchStore);
  protected readonly session = inject(SingleImageSession);
  protected readonly content = CROPPER_CONTENT;
  protected readonly ratios = ASPECT_RATIOS;

  protected readonly rotate = signal<RotationAngle>(0);
  protected readonly flipH = signal(false);
  protected readonly flipV = signal(false);
  protected readonly zoom = signal(1);
  protected readonly ratioLabel = signal('Free');
  protected readonly rect = signal<CropRect>({ x: 0, y: 0, width: 1, height: 1 });

  protected readonly format = signal<string>('original');
  protected readonly quality = signal(92);
  protected readonly background = signal('#ffffff');

  protected readonly item = this.session.item;
  protected readonly result = this.session.result;
  protected readonly isProcessing = this.session.isProcessing;
  /** The crop stage needs real bounds before it can place a selection. */
  protected readonly isMeasured = this.session.isMeasured;

  protected readonly ratio = computed(
    () => ASPECT_RATIOS.find((option) => option.label === this.ratioLabel())?.ratio ?? null,
  );

  /** Size of the image after rotation — the space the crop rectangle lives in. */
  protected readonly bounds = computed(() => {
    const item = this.item();
    if (!item) {
      return { width: 0, height: 0 };
    }
    return this.cropService.transformedSize(item.width, item.height, this.rotate());
  });

  protected readonly canCrop = computed(
    () =>
      this.isMeasured() &&
      this.rect().width >= 1 &&
      this.rect().height >= 1 &&
      !this.isProcessing(),
  );

  constructor() {
    this.seo.apply(toolPageSeo(CROPPER_CONTENT));

    // Bounds change when a new image is measured or the picture is rotated, and
    // the ratio changes when the user picks one. In all three cases the previous
    // rectangle is meaningless, so start a fresh centred selection.
    effect(() => {
      const bounds = this.bounds();
      const ratio = this.ratio();
      if (bounds.width === 0 || bounds.height === 0) {
        return;
      }
      untracked(() =>
        this.rect.set(this.cropService.centredRect(bounds.width, bounds.height, ratio)),
      );
    });

    afterNextRender(() => {
      const staged = this.handoff.claim();
      if (staged.length > 0) {
        void this.addFiles([...staged]);
      }
    });
  }

  protected async addFiles(files: File[]): Promise<void> {
    await this.session.load(files);
    this.rotate.set(0);
    this.flipH.set(false);
    this.flipV.set(false);
    this.zoom.set(1);
  }

  protected setRatio(label: string): void {
    this.ratioLabel.set(label);
  }

  /** Centres a fresh selection of the current ratio inside the current bounds. */
  protected resetSelection(): void {
    const bounds = this.bounds();
    if (bounds.width === 0 || bounds.height === 0) {
      return;
    }
    this.rect.set(this.cropService.centredRect(bounds.width, bounds.height, this.ratio()));
  }

  protected rotateBy(delta: 90 | -90): void {
    const next = (((this.rotate() + delta) % 360) + 360) % 360;
    this.rotate.set(next as RotationAngle);
  }

  protected toggleFlipH(): void {
    this.flipH.update((value) => !value);
  }

  protected toggleFlipV(): void {
    this.flipV.update((value) => !value);
  }

  protected zoomBy(delta: number): void {
    this.zoom.update((value) => clampZoom(value + delta));
  }

  protected setZoom(value: number): void {
    this.zoom.set(clampZoom(value));
  }

  protected resetTransforms(): void {
    this.rotate.set(0);
    this.flipH.set(false);
    this.flipV.set(false);
    this.zoom.set(1);
    this.resetSelection();
  }

  protected reset(): void {
    this.session.reset();
    this.ratioLabel.set('Free');
    this.resetTransforms();
  }

  protected async crop(): Promise<void> {
    if (!this.canCrop()) {
      return;
    }

    const settings = {
      rect: this.rect(),
      rotate: this.rotate(),
      flipH: this.flipH(),
      flipV: this.flipV(),
      format: this.format() as OutputFormat,
      quality: this.quality(),
      background: this.background(),
    };

    await this.session.run((item, signal) => this.cropService.crop(item, settings, signal));

    const item = this.item();
    if (item?.result) {
      void this.history.record({
        toolId: 'crop',
        toolName: 'Image Cropper',
        toolPath: CROPPER_CONTENT.path,
        fileName: item.fileName,
        sourceSize: item.sourceSize,
        resultSize: item.result.size,
        sourceType: item.sourceType,
        resultType: item.result.type,
        width: item.result.width,
        height: item.result.height,
        summary: `Cropped to ${item.result.width} × ${item.result.height} px (${this.ratioLabel()})`,
      });
    }
  }
}

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 10) / 10));
}
