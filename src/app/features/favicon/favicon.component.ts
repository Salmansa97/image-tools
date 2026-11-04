import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';

import { FitMode } from '../../core/models/image.models';
import { FAVICON_SIZES, FaviconBundle, FaviconService } from '../../core/services/favicon.service';
import { ImageBatchStore } from '../../core/services/image-batch.store';
import { ProcessingCancelledError } from '../../core/services/image-worker.service';
import { ProcessingHistoryService } from '../../core/services/processing-history.service';
import { SeoService } from '../../core/services/seo.service';
import { SingleImageSession } from '../../core/services/single-image-session';
import { UploadHandoffService } from '../../core/services/upload-handoff.service';
import { ZipDownloadService } from '../../core/services/zip-download.service';
import { toolPageSeo } from '../../seo/tool-page-seo';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { CopyButtonComponent } from '../../shared/components/copy-button/copy-button.component';
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
import { FAVICON_CONTENT } from './favicon.content';

const FIT_OPTIONS: readonly SegmentOption[] = [
  { label: 'Fill', value: 'cover', hint: 'Crop to a square' },
  { label: 'Fit', value: 'contain', hint: 'Pad to a square' },
  { label: 'Stretch', value: 'stretch', hint: 'Distort to a square' },
];

@Component({
  selector: 'app-favicon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ImageBatchStore, SingleImageSession],
  imports: [
    ToolPageComponent,
    FileUploaderComponent,
    OptionsPanelComponent,
    SegmentedControlComponent,
    ToolActionButtonComponent,
    CopyButtonComponent,
    IconComponent,
    AlertComponent,
    FileSizePipe,
  ],
  templateUrl: './favicon.component.html',
})
export class FaviconComponent implements OnDestroy {
  private readonly faviconService = inject(FaviconService);
  private readonly zip = inject(ZipDownloadService);
  private readonly handoff = inject(UploadHandoffService);
  private readonly history = inject(ProcessingHistoryService);
  private readonly seo = inject(SeoService);

  protected readonly session = inject(SingleImageSession);
  protected readonly content = FAVICON_CONTENT;
  protected readonly allSizes = FAVICON_SIZES;
  protected readonly fitOptions = FIT_OPTIONS;

  protected readonly item = this.session.item;
  protected readonly isMeasured = this.session.isMeasured;

  protected readonly selectedSizes = signal<readonly number[]>(
    FAVICON_SIZES.filter((size) => size.standard).map((size) => size.size),
  );
  protected readonly fit = signal<string>('cover');
  protected readonly background = signal('#ffffff');
  protected readonly transparent = signal(true);
  protected readonly includeIco = signal(true);
  protected readonly appName = signal('My Website');
  protected readonly themeColor = signal('#7c3aed');

  protected readonly bundle = signal<FaviconBundle | null>(null);
  protected readonly generating = signal(false);
  protected readonly progress = signal(0);
  protected readonly zipping = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private controller: AbortController | null = null;

  protected readonly isSquare = computed(() => {
    const item = this.item();
    return item ? item.width === item.height : true;
  });

  protected readonly isSmall = computed(() => {
    const item = this.item();
    if (!item || item.width === 0) {
      return false;
    }
    return Math.min(item.width, item.height) < Math.max(...this.selectedSizes(), 0);
  });

  protected readonly canGenerate = computed(
    () => this.isMeasured() && this.selectedSizes().length > 0 && !this.generating(),
  );

  constructor() {
    this.seo.apply(toolPageSeo(FAVICON_CONTENT));

    afterNextRender(() => {
      const staged = this.handoff.claim();
      if (staged.length > 0) {
        void this.addFiles([...staged]);
      }
    });
  }

  ngOnDestroy(): void {
    this.releaseBundle();
  }

  protected async addFiles(files: File[]): Promise<void> {
    this.releaseBundle();
    await this.session.load(files);
  }

  protected isSelected(size: number): boolean {
    return this.selectedSizes().includes(size);
  }

  protected toggleSize(size: number): void {
    this.selectedSizes.update((sizes) =>
      sizes.includes(size)
        ? sizes.filter((entry) => entry !== size)
        : [...sizes, size].sort((a, b) => a - b),
    );
    this.releaseBundle();
  }

  protected selectStandard(): void {
    this.selectedSizes.set(FAVICON_SIZES.filter((size) => size.standard).map((size) => size.size));
    this.releaseBundle();
  }

  protected selectAll(): void {
    this.selectedSizes.set(FAVICON_SIZES.map((size) => size.size));
    this.releaseBundle();
  }

  protected reset(): void {
    this.controller?.abort();
    this.controller = null;
    this.releaseBundle();
    this.session.reset();
    this.selectStandard();
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

    this.releaseBundle();
    this.errorMessage.set(null);
    this.generating.set(true);
    this.progress.set(0);

    const controller = new AbortController();
    this.controller = controller;

    try {
      const bundle = await this.faviconService.generate(
        item,
        {
          sizes: this.selectedSizes(),
          fit: this.fit() as FitMode,
          background: this.background(),
          transparent: this.transparent(),
          includeIco: this.includeIco(),
          appName: this.appName(),
          themeColor: this.themeColor(),
        },
        (done, total) => this.progress.set(Math.round((done / total) * 100)),
        controller.signal,
      );

      this.bundle.set(bundle);

      void this.history.record({
        toolId: 'favicon',
        toolName: 'Favicon Generator',
        toolPath: FAVICON_CONTENT.path,
        fileName: item.fileName,
        sourceSize: item.sourceSize,
        resultSize: bundle.icons.reduce((total, icon) => total + icon.blob.size, 0),
        sourceType: item.sourceType,
        resultType: 'image/png',
        width: Math.max(...bundle.icons.map((icon) => icon.size)),
        height: Math.max(...bundle.icons.map((icon) => icon.size)),
        summary: `Generated ${bundle.icons.length} icon sizes`,
      });
    } catch (error) {
      if (!(error instanceof ProcessingCancelledError)) {
        this.errorMessage.set(
          error instanceof Error ? error.message : 'The icons could not be generated.',
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
    const bundle = this.bundle();
    if (!bundle || this.zipping()) {
      return;
    }

    this.zipping.set(true);
    this.errorMessage.set(null);

    try {
      const entries = bundle.icons.map((icon) => ({ fileName: icon.fileName, blob: icon.blob }));

      if (bundle.ico) {
        entries.push({ fileName: 'favicon.ico', blob: bundle.ico });
      }
      entries.push({
        fileName: 'site.webmanifest',
        blob: new Blob([bundle.manifest], { type: 'application/manifest+json' }),
      });
      entries.push({
        fileName: 'favicon-snippet.html',
        blob: new Blob([bundle.html], { type: 'text/html' }),
      });

      await this.zip.downloadZip(entries, 'imagetools-favicons.zip');
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'The ZIP archive could not be created.',
      );
    } finally {
      this.zipping.set(false);
    }
  }

  /** Icon previews own their object URLs and must release them on replacement. */
  private releaseBundle(): void {
    const bundle = this.bundle();
    if (bundle) {
      for (const icon of bundle.icons) {
        URL.revokeObjectURL(icon.url);
      }
      this.bundle.set(null);
    }
  }
}
