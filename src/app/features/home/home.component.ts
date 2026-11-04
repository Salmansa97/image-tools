import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { RejectedFile } from '../../core/models/image.models';
import { FEATURED_TOOLS, POPULAR_TOOLS, TOOLS } from '../../core/models/tools.catalog';
import { SeoService } from '../../core/services/seo.service';
import { UploadHandoffService } from '../../core/services/upload-handoff.service';
import { validateFiles } from '../../core/utilities/file.utils';
import { faqSchema, itemListSchema } from '../../seo/structured-data';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from '../../seo/site.config';
import { AuroraComponent } from '../../shared/components/aurora/aurora.component';
import { CountUpComponent } from '../../shared/components/count-up/count-up.component';
import { FaqAccordionComponent } from '../../shared/components/faq-accordion/faq-accordion.component';
import { FileUploaderComponent } from '../../shared/components/file-uploader/file-uploader.component';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';
import { ToolDefinition } from '../../shared/components/tool-card/tool-card.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { HeroDemoComponent } from './hero-demo.component';
import { HOME_BENEFITS, HOME_FAQS, HOME_STEPS } from './home.content';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FileUploaderComponent,
    FaqAccordionComponent,
    IconComponent,
    AuroraComponent,
    CountUpComponent,
    HeroDemoComponent,
    RevealDirective,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly handoff = inject(UploadHandoffService);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);

  protected readonly tools = FEATURED_TOOLS;
  protected readonly allTools = TOOLS;
  protected readonly popular = POPULAR_TOOLS;
  protected readonly steps = HOME_STEPS;
  protected readonly benefits = HOME_BENEFITS;
  protected readonly faqs = HOME_FAQS;

  protected readonly heroPoints = [
    'JPG, JPEG, PNG, WebP',
    'Up to 50 MB per image',
    'No sign-up required',
  ] as const;

  /**
   * Figures that are true by construction rather than marketing claims: the
   * tool count comes from the catalogue, and "0 uploaded" is what the
   * architecture guarantees.
   */
  protected readonly stats = [
    {
      value: TOOLS.length,
      prefix: '',
      suffix: '',
      label: 'Image tools',
      note: 'Every one of them free',
    },
    {
      value: 0,
      prefix: '',
      suffix: '',
      label: 'Images uploaded',
      note: 'Processed on your device',
    },
    {
      value: 50,
      prefix: '',
      suffix: ' MB',
      label: 'Max file size',
      note: 'Per image, no daily cap',
    },
    {
      value: 100,
      prefix: '',
      suffix: '%',
      label: 'Free, forever',
      note: 'No account, no watermark',
    },
  ] as const;

  /** Scrolling strip under the hero. */
  protected readonly marquee: readonly { icon: IconName; label: string }[] = [
    { icon: 'compress', label: 'Compress' },
    { icon: 'resize', label: 'Resize' },
    { icon: 'crop', label: 'Crop' },
    { icon: 'convert', label: 'Convert' },
    { icon: 'rotate-right', label: 'Rotate' },
    { icon: 'flip-horizontal', label: 'Flip' },
    { icon: 'sparkles', label: 'Filters' },
    { icon: 'stamp', label: 'Watermark' },
    { icon: 'star', label: 'Favicons' },
    { icon: 'share', label: 'Social sizes' },
    { icon: 'info', label: 'EXIF viewer' },
    { icon: 'shield', label: 'Strip metadata' },
    { icon: 'palette', label: 'Colour picker' },
    { icon: 'code', label: 'Base64' },
  ];

  /**
   * The strip duplicated end to end. A marquee that translates by -50% needs
   * two identical halves to loop without a visible jump; the copy is hidden
   * from assistive technology so the labels are not announced twice.
   */
  protected readonly marqueeLoop: readonly {
    icon: IconName;
    label: string;
    key: string;
    duplicate: boolean;
  }[] = [
    ...this.marquee.map((item) => ({ ...item, key: `a-${item.label}`, duplicate: false })),
    ...this.marquee.map((item) => ({ ...item, key: `b-${item.label}`, duplicate: true })),
  ];

  /** Files dropped on the hero, held until the visitor picks a tool. */
  protected readonly stagedFiles = signal<readonly File[]>([]);
  protected readonly rejected = signal<readonly RejectedFile[]>([]);

  constructor() {
    this.seo.apply({
      title: `${SITE_NAME} — ${SITE_TAGLINE} | Free Online Image Compressor, Resizer, Cropper & Converter`,
      description: SITE_DESCRIPTION,
      path: '/',
      keywords: [
        'image tools',
        'compress image',
        'resize image',
        'crop image',
        'convert image',
        'online image editor',
        'free image compressor',
      ],
      structuredData: [
        itemListSchema(
          'Free online image tools',
          TOOLS.map((tool) => ({
            name: tool.name,
            path: tool.path,
            description: tool.description,
          })),
        ),
        faqSchema(HOME_FAQS),
      ],
    });
  }

  protected onFilesSelected(files: File[]): void {
    const { accepted, rejected } = validateFiles(files);
    this.rejected.set(rejected);

    if (accepted.length > 0) {
      this.stagedFiles.set(accepted);
    }
  }

  protected cancelSelection(): void {
    this.stagedFiles.set([]);
  }

  /** Hands the staged files to the chosen tool and navigates there. */
  protected async openWith(tool: ToolDefinition): Promise<void> {
    const files = this.stagedFiles();
    if (files.length === 0) {
      await this.router.navigateByUrl(tool.path);
      return;
    }

    // The resizer and cropper work on a single image at a time.
    const singleImageTool = tool.id === 'resize' || tool.id === 'crop';
    this.handoff.stage(singleImageTool ? files.slice(0, 1) : files);
    this.stagedFiles.set([]);
    await this.router.navigateByUrl(tool.path);
  }
}
