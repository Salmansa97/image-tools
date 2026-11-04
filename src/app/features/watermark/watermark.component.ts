import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgStyle } from '@angular/common';

import { ImageItem, OutputFormat, WatermarkPosition } from '../../core/models/image.models';
import { BatchSession } from '../../core/services/batch-session';
import { ImageBatchStore } from '../../core/services/image-batch.store';
import {
  ImageWatermarkService,
  WATERMARK_FONTS,
  WATERMARK_POSITIONS,
  WatermarkSettings,
} from '../../core/services/image-watermark.service';
import { ProcessingHistoryService } from '../../core/services/processing-history.service';
import { SeoService } from '../../core/services/seo.service';
import { UploadHandoffService } from '../../core/services/upload-handoff.service';
import { validateFilesByContent } from '../../core/utilities/file.utils';
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
import { WATERMARK_CONTENT } from './watermark.content';

@Component({
  selector: 'app-watermark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ImageBatchStore, BatchSession],
  imports: [
    ReactiveFormsModule,
    NgStyle,
    ToolPageComponent,
    FileUploaderComponent,
    OptionsPanelComponent,
    OutputFormatFieldComponent,
    ToolActionButtonComponent,
    ProcessingProgressComponent,
    ImageCardComponent,
    IconComponent,
    AlertComponent,
  ],
  templateUrl: './watermark.component.html',
})
export class WatermarkComponent implements OnDestroy {
  private readonly watermarkService = inject(ImageWatermarkService);
  private readonly handoff = inject(UploadHandoffService);
  private readonly history = inject(ProcessingHistoryService);
  private readonly seo = inject(SeoService);
  private readonly fb = inject(FormBuilder);

  protected readonly store = inject(ImageBatchStore);
  protected readonly session = inject(BatchSession);
  protected readonly content = WATERMARK_CONTENT;
  protected readonly positions = WATERMARK_POSITIONS;
  protected readonly fonts = WATERMARK_FONTS;

  /**
   * A reactive form rather than loose signals: the watermark has a dozen related
   * controls with a real validation rule (text mode needs non-empty text), which
   * is exactly what `FormGroup` and its validators are for.
   */
  protected readonly form = this.fb.nonNullable.group({
    mode: this.fb.nonNullable.control<'text' | 'image'>('text'),
    text: this.fb.nonNullable.control('© Your Name', [
      Validators.required,
      Validators.maxLength(80),
    ]),
    fontFamily: this.fb.nonNullable.control(WATERMARK_FONTS[0].value),
    fontScale: this.fb.nonNullable.control(6, [Validators.min(1), Validators.max(40)]),
    color: this.fb.nonNullable.control('#ffffff'),
    opacity: this.fb.nonNullable.control(45, [Validators.min(5), Validators.max(100)]),
    position: this.fb.nonNullable.control<WatermarkPosition>('bottom-right'),
    margin: this.fb.nonNullable.control(4, [Validators.min(0), Validators.max(25)]),
    rotation: this.fb.nonNullable.control(0, [Validators.min(-90), Validators.max(90)]),
    tile: this.fb.nonNullable.control(false),
    tileGap: this.fb.nonNullable.control(20, [Validators.min(2), Validators.max(80)]),
    imageScale: this.fb.nonNullable.control(25, [Validators.min(2), Validators.max(100)]),
    shadow: this.fb.nonNullable.control(true),
  });

  /** Mirrors the form into a signal so the template can react to it. */
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  /**
   * Validity as a signal.
   *
   * `form.valid` is an ordinary property, so a computed that reads it would be
   * cached forever and never notice a control turning invalid.
   */
  private readonly formStatus = toSignal(this.form.statusChanges, {
    initialValue: this.form.status,
  });

  protected readonly format = signal<string>('original');
  protected readonly quality = signal(92);
  protected readonly background = signal('#ffffff');

  protected readonly overlayFile = signal<File | null>(null);
  protected readonly overlayUrl = signal<string | null>(null);
  protected readonly overlayError = signal<string | null>(null);

  protected readonly mode = computed(() => this.formValue().mode ?? 'text');
  protected readonly isTiled = computed(() => this.formValue().tile ?? false);

  /** The first loaded image drives the preview; settings apply to the whole batch. */
  protected readonly previewItem = computed<ImageItem | null>(() => this.store.items()[0] ?? null);

  /** Fixed tile count for the preview overlay, hoisted out of the template. */
  protected readonly tileSlots = Array.from({ length: 12 }, (_, i) => i);

  protected readonly needsOverlay = computed(
    () => this.mode() === 'image' && this.overlayFile() === null,
  );

  protected readonly canApply = computed(
    () =>
      !this.store.isEmpty() &&
      !this.store.isProcessing() &&
      this.formStatus() === 'VALID' &&
      !this.needsOverlay(),
  );

  /** Inline style that approximates the mark's placement in the preview. */
  protected readonly markStyle = computed(() => {
    const value = this.formValue();
    const vertical = (value.position ?? 'bottom-right').split('-')[0];
    const horizontal = (value.position ?? 'bottom-right').split('-')[1];
    const margin = `${value.margin ?? 4}%`;

    const style: Record<string, string> = {
      position: 'absolute',
      opacity: String((value.opacity ?? 45) / 100),
      transform: `rotate(${value.rotation ?? 0}deg)`,
      transformOrigin: 'center',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    };

    if (vertical === 'top') {
      style['top'] = margin;
    } else if (vertical === 'bottom') {
      style['bottom'] = margin;
    } else {
      style['top'] = '50%';
      style['translate'] = '0 -50%';
    }

    if (horizontal === 'left') {
      style['left'] = margin;
    } else if (horizontal === 'right') {
      style['right'] = margin;
    } else {
      style['left'] = '50%';
      style['translate'] = vertical === 'middle' ? '-50% -50%' : '-50% 0';
    }

    return style;
  });

  protected readonly markTextStyle = computed(() => {
    const value = this.formValue();
    return {
      color: value.color ?? '#ffffff',
      fontFamily: value.fontFamily ?? WATERMARK_FONTS[0].value,
      // Preview container is 100% wide; scale relative to it the way the export does.
      fontSize: `${((value.fontScale ?? 6) / 100) * 18}rem`,
      fontWeight: '600',
      textShadow: value.shadow ? '0 2px 6px rgba(0,0,0,0.45)' : 'none',
    };
  });

  constructor() {
    this.seo.apply(toolPageSeo(WATERMARK_CONTENT));

    // Text is only required in text mode; toggling must not leave a stale error.
    this.form.controls.mode.valueChanges.pipe(takeUntilDestroyed()).subscribe((mode) => {
      const text = this.form.controls.text;
      if (mode === 'text') {
        text.addValidators(Validators.required);
      } else {
        text.removeValidators(Validators.required);
      }
      text.updateValueAndValidity({ emitEvent: false });
    });

    afterNextRender(() => {
      const staged = this.handoff.claim();
      if (staged.length > 0) {
        void this.session.add([...staged]);
      }
    });
  }

  ngOnDestroy(): void {
    this.releaseOverlay();
  }

  /** Accepts the logo image, validated by content like any other upload. */
  protected async chooseOverlay(files: File[]): Promise<void> {
    this.overlayError.set(null);
    const { accepted, rejected } = await validateFilesByContent(files.slice(0, 1));

    if (accepted.length === 0) {
      this.overlayError.set(rejected[0]?.message ?? 'That file could not be used as a watermark.');
      return;
    }

    this.releaseOverlay();
    const file = accepted[0];
    this.overlayFile.set(file);
    this.overlayUrl.set(URL.createObjectURL(file));
  }

  protected clearOverlay(): void {
    this.releaseOverlay();
    this.overlayFile.set(null);
  }

  private releaseOverlay(): void {
    const url = this.overlayUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.overlayUrl.set(null);
    }
  }

  protected reset(): void {
    this.session.reset();
    this.clearOverlay();
    this.form.reset();
    this.format.set('original');
  }

  protected async apply(): Promise<void> {
    if (!this.canApply()) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const settings: WatermarkSettings = {
      ...raw,
      format: this.format() as OutputFormat,
      quality: this.quality(),
      background: this.background(),
    };

    const overlay = this.overlayFile();

    await this.session.run((item, signal) =>
      this.watermarkService.apply(item, settings, overlay, signal),
    );

    for (const item of this.store.completed()) {
      void this.history.record({
        toolId: 'watermark',
        toolName: 'Watermark Maker',
        toolPath: WATERMARK_CONTENT.path,
        fileName: item.fileName,
        sourceSize: item.sourceSize,
        resultSize: item.result?.size ?? 0,
        sourceType: item.sourceType,
        resultType: item.result?.type ?? '',
        width: item.result?.width ?? 0,
        height: item.result?.height ?? 0,
        summary:
          raw.mode === 'text'
            ? `Text watermark “${raw.text}”${raw.tile ? ', tiled' : ''}`
            : `Logo watermark${raw.tile ? ', tiled' : ''}`,
      });
    }
  }

  protected downloadZip(): Promise<void> {
    return this.session.downloadZip('imagetools-watermarked.zip');
  }
}
