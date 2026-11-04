import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';

import { OutputFormat } from '../../core/models/image.models';
import {
  BackgroundRemovalService,
  PreviewSource,
} from '../../core/services/background-removal.service';
import { ImageBatchStore } from '../../core/services/image-batch.store';
import { ProcessingHistoryService } from '../../core/services/processing-history.service';
import { SeoService } from '../../core/services/seo.service';
import { SingleImageSession } from '../../core/services/single-image-session';
import { UploadHandoffService } from '../../core/services/upload-handoff.service';
import {
  DEFAULT_REMOVAL_OPTIONS,
  MANUAL_ERASE,
  MANUAL_KEEP,
  ManualValue,
  RemovalOptions,
  Rgb,
} from '../../core/utilities/background-removal';
import { toHex } from '../../core/utilities/color';
import { HistoryStack } from '../../core/utilities/history-stack';
import { toolPageSeo } from '../../seo/tool-page-seo';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { DownloadButtonComponent } from '../../shared/components/download-button/download-button.component';
import { FileUploaderComponent } from '../../shared/components/file-uploader/file-uploader.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { OptionsPanelComponent } from '../../shared/components/options-panel/options-panel.component';
import {
  SegmentedControlComponent,
  SegmentOption,
} from '../../shared/components/segmented-control/segmented-control.component';
import { ToolActionButtonComponent } from '../../shared/components/tool-action-button/tool-action-button.component';
import { ToolPageComponent } from '../../shared/components/tool-page/tool-page.component';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { BACKGROUND_REMOVER_CONTENT } from './background-remover.content';

type Tool = 'pick' | 'erase' | 'restore';

const MODE_OPTIONS: readonly SegmentOption[] = [
  { label: 'Connected', value: 'contiguous', hint: 'Only background touching the frame edge' },
  { label: 'Everywhere', value: 'global', hint: 'Every matching colour in the image' },
];

const BACKDROPS: readonly { label: string; value: string }[] = [
  { label: 'Transparent', value: 'transparent' },
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#000000' },
  { label: 'Custom', value: 'custom' },
];

@Component({
  selector: 'app-background-remover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ImageBatchStore, SingleImageSession],
  imports: [
    ToolPageComponent,
    FileUploaderComponent,
    OptionsPanelComponent,
    SegmentedControlComponent,
    ToolActionButtonComponent,
    DownloadButtonComponent,
    IconComponent,
    AlertComponent,
    FileSizePipe,
  ],
  templateUrl: './background-remover.component.html',
})
export class BackgroundRemoverComponent {
  private readonly removal = inject(BackgroundRemovalService);
  private readonly handoff = inject(UploadHandoffService);
  private readonly history = inject(ProcessingHistoryService);
  private readonly seo = inject(SeoService);

  protected readonly session = inject(SingleImageSession);
  protected readonly content = BACKGROUND_REMOVER_CONTENT;
  protected readonly modeOptions = MODE_OPTIONS;
  protected readonly backdrops = BACKDROPS;

  protected readonly item = this.session.item;
  protected readonly result = this.session.result;
  protected readonly isProcessing = this.session.isProcessing;

  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  private source: PreviewSource | null = null;
  private manual: Uint8Array | null = null;

  /** Brush strokes, so undo does not need a full mask snapshot per stroke. */
  private readonly strokes = new HistoryStack<readonly StrokeRecord[]>([]);

  protected readonly canUndo = this.strokes.canUndo;
  protected readonly canRedo = this.strokes.canRedo;

  protected readonly ready = signal(false);
  protected readonly analysing = signal(false);
  protected readonly removedPercent = signal(0);

  protected readonly tolerance = signal(DEFAULT_REMOVAL_OPTIONS.tolerance);
  protected readonly edgeSoftness = signal(DEFAULT_REMOVAL_OPTIONS.edgeSoftness);
  protected readonly shrink = signal(DEFAULT_REMOVAL_OPTIONS.shrink);
  protected readonly despill = signal(DEFAULT_REMOVAL_OPTIONS.despill);
  protected readonly mode = signal<string>(DEFAULT_REMOVAL_OPTIONS.mode);
  protected readonly keyColor = signal<Rgb | null>(null);

  protected readonly tool = signal<Tool>('pick');
  protected readonly brushSize = signal(26);

  protected readonly backdrop = signal('transparent');
  protected readonly customBackdrop = signal('#ffffff');
  protected readonly format = signal<string>('image/png');
  protected readonly quality = signal(92);

  protected readonly keyColorHex = computed(() => {
    const colour = this.keyColor();
    return colour ? toHex(colour) : null;
  });

  protected readonly effectiveBackdrop = computed(() =>
    this.backdrop() === 'custom' ? this.customBackdrop() : this.backdrop(),
  );

  /** JPEG has no alpha, so a transparent export must stay PNG or WebP. */
  protected readonly formatOptions = computed<readonly SegmentOption[]>(() => {
    const transparent = this.effectiveBackdrop() === 'transparent';
    return [
      { label: 'PNG', value: 'image/png', hint: 'Lossless, keeps transparency' },
      { label: 'WebP', value: 'image/webp', hint: 'Smaller, keeps transparency' },
      {
        label: 'JPG',
        value: 'image/jpeg',
        disabled: transparent,
        hint: transparent ? 'Pick a backdrop colour first — JPEG has no transparency' : 'Smallest',
      },
    ];
  });

  protected readonly isBrush = computed(() => this.tool() !== 'pick');

  /** The matte-size readout shows a sign separately from the magnitude. */
  protected readonly absShrink = computed(() => Math.abs(this.shrink()));

  constructor() {
    this.seo.apply(toolPageSeo(BACKGROUND_REMOVER_CONTENT));

    // The canvas lives behind an `@if`, so it does not exist at the moment the
    // image finishes loading. `viewChild` is a signal, so this runs as soon as
    // the element is actually in the DOM.
    effect(() => {
      const element = this.canvas();
      if (element && this.ready()) {
        untracked(() => this.render());
      }
    });

    afterNextRender(() => {
      const staged = this.handoff.claim();
      if (staged.length > 0) {
        void this.addFiles([...staged]);
      }
    });
  }

  protected async addFiles(files: File[]): Promise<void> {
    this.ready.set(false);
    this.source = null;
    this.manual = null;
    this.strokes.reset([]);

    await this.session.load(files);

    const item = this.item();
    if (!item) {
      return;
    }

    this.analysing.set(true);
    try {
      this.source = await this.removal.loadPreview(item.file);
      this.manual = new Uint8Array(this.source.width * this.source.height);
      this.ready.set(true);
    } catch (error) {
      this.session.errorMessage.set(
        error instanceof Error ? error.message : 'This image could not be opened.',
      );
    } finally {
      this.analysing.set(false);
    }
  }

  /* ----------------------------- Preview ----------------------------- */

  private options(): RemovalOptions {
    return {
      tolerance: this.tolerance(),
      edgeSoftness: this.edgeSoftness(),
      shrink: this.shrink(),
      despill: this.despill(),
      mode: this.mode() as RemovalOptions['mode'],
      keyColor: this.keyColor(),
    };
  }

  /** Recomputes the matte and paints it onto the preview canvas. */
  private render(): void {
    const source = this.source;
    const element = this.canvas()?.nativeElement;
    if (!source || !element) {
      return;
    }

    const { image, removed } = this.removal.preview(source, this.options(), this.manual);
    this.removedPercent.set(removed);

    element.width = source.width;
    element.height = source.height;
    element.getContext('2d')?.putImageData(image, 0, 0);
  }

  /** Re-renders after a setting changes, invalidating any previous export. */
  protected refresh(): void {
    this.render();
    // The settings changed, so a previous export no longer matches the preview.
    this.session.clearResult();
  }

  /* ------------------------------ Input ------------------------------ */

  private pointerFrom(event: PointerEvent): { x: number; y: number } | null {
    const source = this.source;
    const element = this.canvas()?.nativeElement;
    if (!source || !element) {
      return null;
    }
    const rect = element.getBoundingClientRect();
    if (rect.width === 0) {
      return null;
    }
    return {
      x: ((event.clientX - rect.left) / rect.width) * source.width,
      y: ((event.clientY - rect.top) / rect.height) * source.height,
    };
  }

  private painting = false;
  private lastPoint: { x: number; y: number } | null = null;
  private strokePoints: { x: number; y: number }[] = [];

  protected onPointerDown(event: PointerEvent): void {
    const point = this.pointerFrom(event);
    if (!point) {
      return;
    }
    event.preventDefault();
    (event.target as Element).setPointerCapture?.(event.pointerId);

    if (this.tool() === 'pick') {
      this.keyColor.set(this.removal.sampleColour(this.source!, point.x, point.y));
      this.refresh();
      return;
    }

    this.painting = true;
    this.lastPoint = null;
    this.strokePoints = [];
    this.paintTo(point);
  }

  protected onPointerMove(event: PointerEvent): void {
    if (!this.painting) {
      return;
    }
    const point = this.pointerFrom(event);
    if (point) {
      event.preventDefault();
      this.paintTo(point);
    }
  }

  protected onPointerUp(event: PointerEvent): void {
    if (!this.painting) {
      return;
    }
    (event.target as Element).releasePointerCapture?.(event.pointerId);
    this.painting = false;

    if (this.strokePoints.length > 0) {
      // Record the stroke, not the mask: a few hundred points instead of
      // megabytes per undo step.
      this.strokes.commit([
        ...this.strokes.value(),
        {
          tool: this.tool() === 'erase' ? MANUAL_ERASE : MANUAL_KEEP,
          radius: this.brushRadius(),
          points: this.strokePoints,
        },
      ]);
    }

    this.lastPoint = null;
    this.strokePoints = [];
  }

  /** Brush radius in preview pixels, scaled so it feels constant on screen. */
  private brushRadius(): number {
    const source = this.source;
    if (!source) {
      return this.brushSize();
    }
    const element = this.canvas()?.nativeElement;
    const displayed = element?.getBoundingClientRect().width ?? source.width;
    return (this.brushSize() / 2) * (source.width / Math.max(1, displayed));
  }

  private paintTo(point: { x: number; y: number }): void {
    const source = this.source;
    if (!source || !this.manual) {
      return;
    }

    this.removal.paint(
      this.manual,
      source.width,
      source.height,
      this.lastPoint,
      point,
      this.brushRadius(),
      this.tool() === 'erase' ? MANUAL_ERASE : MANUAL_KEEP,
    );

    this.lastPoint = point;
    this.strokePoints.push(point);
    this.refresh();
  }

  /* ------------------------------ Undo ------------------------------- */

  /** Rebuilds the manual mask by replaying the surviving strokes. */
  private replay(): void {
    const source = this.source;
    if (!source) {
      return;
    }

    this.manual = new Uint8Array(source.width * source.height);

    for (const stroke of this.strokes.value()) {
      let previous: { x: number; y: number } | null = null;
      for (const point of stroke.points) {
        this.removal.paint(
          this.manual,
          source.width,
          source.height,
          previous,
          point,
          stroke.radius,
          stroke.tool,
        );
        previous = point;
      }
    }

    this.refresh();
  }

  protected undo(): void {
    this.strokes.undo();
    this.replay();
  }

  protected redo(): void {
    this.strokes.redo();
    this.replay();
  }

  protected clearBrushwork(): void {
    this.strokes.commit([]);
    this.replay();
  }

  protected resetSettings(): void {
    this.tolerance.set(DEFAULT_REMOVAL_OPTIONS.tolerance);
    this.edgeSoftness.set(DEFAULT_REMOVAL_OPTIONS.edgeSoftness);
    this.shrink.set(DEFAULT_REMOVAL_OPTIONS.shrink);
    this.despill.set(DEFAULT_REMOVAL_OPTIONS.despill);
    this.mode.set(DEFAULT_REMOVAL_OPTIONS.mode);
    this.keyColor.set(null);
    this.refresh();
  }

  protected reset(): void {
    this.session.reset();
    this.source = null;
    this.manual = null;
    this.strokes.reset([]);
    this.ready.set(false);
    this.resetSettings();
  }

  /* ----------------------------- Export ------------------------------ */

  protected async exportImage(): Promise<void> {
    const source = this.source;
    if (!source) {
      return;
    }

    await this.session.run((item, signal) =>
      this.removal.export(
        item,
        {
          ...this.options(),
          background: this.effectiveBackdrop(),
          format: this.format() as OutputFormat,
          quality: this.quality(),
        },
        this.manual,
        { width: source.width, height: source.height },
        signal,
      ),
    );

    const item = this.item();
    if (item?.result) {
      void this.history.record({
        toolId: 'remove-bg',
        toolName: 'Background Remover',
        toolPath: BACKGROUND_REMOVER_CONTENT.path,
        fileName: item.fileName,
        sourceSize: item.sourceSize,
        resultSize: item.result.size,
        sourceType: item.sourceType,
        resultType: item.result.type,
        width: item.result.width,
        height: item.result.height,
        summary:
          this.effectiveBackdrop() === 'transparent'
            ? `Background removed (${this.removedPercent()}% transparent)`
            : `Background replaced with ${this.effectiveBackdrop()}`,
      });
    }
  }
}

interface StrokeRecord {
  readonly tool: ManualValue;
  readonly radius: number;
  readonly points: readonly { x: number; y: number }[];
}
