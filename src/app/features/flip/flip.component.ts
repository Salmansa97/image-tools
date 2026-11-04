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
import { FLIP_CONTENT } from './flip.content';

@Component({
  selector: 'app-flip',
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
  templateUrl: './flip.component.html',
})
export class FlipComponent {
  private readonly transformService = inject(ImageTransformService);
  private readonly handoff = inject(UploadHandoffService);
  private readonly history = inject(ProcessingHistoryService);
  private readonly seo = inject(SeoService);

  protected readonly session = inject(SingleImageSession);
  protected readonly content = FLIP_CONTENT;

  protected readonly item = this.session.item;
  protected readonly result = this.session.result;
  protected readonly isProcessing = this.session.isProcessing;
  protected readonly isMeasured = this.session.isMeasured;

  protected readonly flipH = signal(false);
  protected readonly flipV = signal(false);
  protected readonly format = signal<string>('original');
  protected readonly quality = signal(92);
  protected readonly background = signal('#ffffff');

  protected readonly previewTransform = computed(
    () => `scale(${this.flipH() ? -1 : 1}, ${this.flipV() ? -1 : 1})`,
  );

  protected readonly summary = computed(() => {
    if (this.flipH() && this.flipV()) {
      return 'Mirrored both ways — the same as a 180° turn.';
    }
    if (this.flipH()) {
      return 'Mirrored left to right.';
    }
    if (this.flipV()) {
      return 'Mirrored top to bottom.';
    }
    return 'Choose a direction to mirror the image.';
  });

  protected readonly canFlip = computed(
    () => this.isMeasured() && (this.flipH() || this.flipV()) && !this.isProcessing(),
  );

  constructor() {
    this.seo.apply(toolPageSeo(FLIP_CONTENT));

    afterNextRender(() => {
      const staged = this.handoff.claim();
      if (staged.length > 0) {
        void this.addFiles([...staged]);
      }
    });
  }

  protected async addFiles(files: File[]): Promise<void> {
    await this.session.load(files);
    this.flipH.set(false);
    this.flipV.set(false);
  }

  protected toggleH(): void {
    this.flipH.update((value) => !value);
    this.session.clearResult();
  }

  protected toggleV(): void {
    this.flipV.update((value) => !value);
    this.session.clearResult();
  }

  protected reset(): void {
    this.session.reset();
    this.flipH.set(false);
    this.flipV.set(false);
    this.format.set('original');
  }

  protected async flip(): Promise<void> {
    if (!this.canFlip()) {
      return;
    }

    await this.session.run((item, signal) =>
      this.transformService.transform(
        item,
        {
          rotate: 0,
          flipH: this.flipH(),
          flipV: this.flipV(),
          format: this.format() as OutputFormat,
          quality: this.quality(),
          background: this.background(),
          transparentCorners: true,
        },
        signal,
      ),
    );

    const item = this.item();
    if (item?.result) {
      void this.history.record({
        toolId: 'flip',
        toolName: 'Image Flipper',
        toolPath: FLIP_CONTENT.path,
        fileName: item.fileName,
        sourceSize: item.sourceSize,
        resultSize: item.result.size,
        sourceType: item.sourceType,
        resultType: item.result.type,
        width: item.result.width,
        height: item.result.height,
        summary: this.summary(),
      });
    }
  }
}
