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
import { ImageTransformService } from '../../core/services/image-transform.service';
import { ProcessingHistoryService } from '../../core/services/processing-history.service';
import { SeoService } from '../../core/services/seo.service';
import { SingleImageSession } from '../../core/services/single-image-session';
import { UploadHandoffService } from '../../core/services/upload-handoff.service';
import { toolPageSeo } from '../../seo/tool-page-seo';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { FileUploaderComponent } from '../../shared/components/file-uploader/file-uploader.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { OptionsPanelComponent } from '../../shared/components/options-panel/options-panel.component';
import { OutputFormatFieldComponent } from '../../shared/components/output-format-field/output-format-field.component';
import { SingleImageResultComponent } from '../../shared/components/single-image-result/single-image-result.component';
import { ToolActionButtonComponent } from '../../shared/components/tool-action-button/tool-action-button.component';
import { ToolPageComponent } from '../../shared/components/tool-page/tool-page.component';
import { ROTATE_CONTENT } from './rotate.content';

@Component({
  selector: 'app-rotate',
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
  templateUrl: './rotate.component.html',
})
export class RotateComponent {
  private readonly transformService = inject(ImageTransformService);
  private readonly handoff = inject(UploadHandoffService);
  private readonly history = inject(ProcessingHistoryService);
  private readonly seo = inject(SeoService);

  protected readonly session = inject(SingleImageSession);
  protected readonly content = ROTATE_CONTENT;

  protected readonly item = this.session.item;
  protected readonly result = this.session.result;
  protected readonly isProcessing = this.session.isProcessing;
  protected readonly isMeasured = this.session.isMeasured;

  /** Total clockwise rotation, 0–359.9. */
  protected readonly angle = signal(0);
  protected readonly format = signal<string>('original');
  protected readonly quality = signal(92);
  protected readonly background = signal('#ffffff');
  protected readonly transparentCorners = signal(true);

  /** A free angle exposes corners; a quarter turn does not. */
  protected readonly exposesCorners = computed(() => this.angle() % 90 !== 0);

  protected readonly outputSize = computed(() => {
    const item = this.item();
    if (!item) {
      return null;
    }
    return this.transformService.rotatedSize(item.width, item.height, this.angle());
  });

  /**
   * Scaled so the rotated bounding box still fits the preview frame, which is
   * what the exported image will look like relative to its own canvas.
   */
  protected readonly previewTransform = computed(() => {
    const item = this.item();
    const size = this.outputSize();
    if (!item || !size || size.width === 0) {
      return `rotate(${this.angle()}deg)`;
    }
    const scale = Math.min(item.width / size.width, item.height / size.height, 1);
    return `rotate(${this.angle()}deg) scale(${scale.toFixed(4)})`;
  });

  protected readonly previewCaption = computed(() => {
    const size = this.outputSize();
    return size ? `Will export at ${size.width} × ${size.height} px` : null;
  });

  constructor() {
    this.seo.apply(toolPageSeo(ROTATE_CONTENT));

    afterNextRender(() => {
      const staged = this.handoff.claim();
      if (staged.length > 0) {
        void this.addFiles([...staged]);
      }
    });
  }

  protected async addFiles(files: File[]): Promise<void> {
    await this.session.load(files);
    this.angle.set(0);
  }

  protected quarterTurn(delta: 90 | -90): void {
    this.angle.update((value) => round1((((value + delta) % 360) + 360) % 360));
    this.session.clearResult();
  }

  protected setAngle(value: number): void {
    this.angle.set(round1(((value % 360) + 360) % 360));
    this.session.clearResult();
  }

  /** Nudges by a fraction of a degree, for levelling a horizon. */
  protected nudge(delta: number): void {
    this.setAngle(this.angle() + delta);
  }

  protected resetAngle(): void {
    this.setAngle(0);
  }

  protected reset(): void {
    this.session.reset();
    this.angle.set(0);
    this.format.set('original');
  }

  protected async rotate(): Promise<void> {
    await this.session.run((item, signal) =>
      this.transformService.transform(
        item,
        {
          rotate: this.angle(),
          flipH: false,
          flipV: false,
          format: this.format() as OutputFormat,
          quality: this.quality(),
          background: this.background(),
          transparentCorners: this.transparentCorners(),
        },
        signal,
      ),
    );

    const item = this.item();
    if (item?.result) {
      void this.history.record({
        toolId: 'rotate',
        toolName: 'Image Rotator',
        toolPath: ROTATE_CONTENT.path,
        fileName: item.fileName,
        sourceSize: item.sourceSize,
        resultSize: item.result.size,
        sourceType: item.sourceType,
        resultType: item.result.type,
        width: item.result.width,
        height: item.result.height,
        summary: `Rotated ${this.angle()}°`,
      });
    }
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
