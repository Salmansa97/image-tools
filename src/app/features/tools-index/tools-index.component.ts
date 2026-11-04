import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  POPULAR_TOOLS,
  TOOLS,
  TOOL_CATEGORIES,
  ToolCategory,
  toolsInCategory,
} from '../../core/models/tools.catalog';
import { SeoService } from '../../core/services/seo.service';
import { breadcrumbSchema, itemListSchema } from '../../seo/structured-data';
import { AuroraComponent } from '../../shared/components/aurora/aurora.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import {
  ToolCardComponent,
  ToolDefinition,
} from '../../shared/components/tool-card/tool-card.component';

@Component({
  selector: 'app-tools-index',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageHeroComponent,
    ToolCardComponent,
    IconComponent,
    AuroraComponent,
    RevealDirective,
  ],
  templateUrl: './tools-index.component.html',
})
export class ToolsIndexComponent {
  private readonly seo = inject(SeoService);

  protected readonly categories = TOOL_CATEGORIES;
  protected readonly popular = POPULAR_TOOLS;
  protected readonly total = TOOLS.length;

  protected readonly breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'All Tools', path: '/tools' },
  ] as const;

  constructor() {
    this.seo.apply({
      title: `All Image Tools — ${TOOLS.length} Free Browser-Based Tools | ImageTools`,
      description: `Every ImageTools utility in one place: compress, resize, crop, convert, rotate, flip, filter, watermark, generate favicons and social sizes, read and strip metadata, pick colours and encode Base64. All free, all private.`,
      path: '/tools',
      keywords: [
        'image tools',
        'free image utilities',
        'online image editor',
        'browser image tools',
      ],
      structuredData: [
        itemListSchema(
          'All ImageTools utilities',
          TOOLS.map((tool) => ({
            name: tool.name,
            path: tool.path,
            description: tool.description,
          })),
        ),
        breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'All Tools', path: '/tools' },
        ]),
      ],
    });
  }

  protected toolsFor(category: ToolCategory): readonly ToolDefinition[] {
    return toolsInCategory(category);
  }
}
