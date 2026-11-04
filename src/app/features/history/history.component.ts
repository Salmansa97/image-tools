import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProcessingHistoryService } from '../../core/services/processing-history.service';
import { SeoService } from '../../core/services/seo.service';
import { savingsPercent } from '../../core/utilities/file.utils';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { PageHeroComponent } from '../../shared/components/page-hero/page-hero.component';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';
import { FormatLabelPipe } from '../../shared/pipes/format-label.pipe';

@Component({
  selector: 'app-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    PageHeroComponent,
    IconComponent,
    AlertComponent,
    FileSizePipe,
    FormatLabelPipe,
  ],
  templateUrl: './history.component.html',
})
export class HistoryComponent {
  private readonly seo = inject(SeoService);

  protected readonly history = inject(ProcessingHistoryService);

  protected readonly breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'History', path: '/history' },
  ] as const;

  protected readonly isEmpty = computed(
    () => this.history.loaded() && this.history.records().length === 0,
  );

  constructor() {
    this.seo.apply({
      title: 'Processing History — ImageTools',
      description:
        'A local log of the images you have processed with ImageTools. Stored in your own browser, never uploaded, and clearable at any time.',
      path: '/history',
      // Personal and device-specific: there is nothing here worth indexing.
      noIndex: true,
    });

    afterNextRender(() => {
      void this.history.load();
    });
  }

  protected saved(sourceSize: number, resultSize: number): number {
    return savingsPercent(sourceSize, resultSize);
  }

  protected when(timestamp: number): string {
    const date = new Date(timestamp);
    const minutes = Math.round((Date.now() - timestamp) / 60_000);

    if (minutes < 1) {
      return 'Just now';
    }
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  protected clear(): void {
    void this.history.clear();
  }

  protected remove(id: string): void {
    void this.history.remove(id);
  }
}
