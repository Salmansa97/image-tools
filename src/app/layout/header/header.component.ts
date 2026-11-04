import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { FEATURED_TOOLS, TOOLS } from '../../core/models/tools.catalog';
import { ThemeService } from '../../core/services/theme.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, IconComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  private readonly router = inject(Router);

  protected readonly theme = inject(ThemeService);
  protected readonly tools = FEATURED_TOOLS;
  protected readonly allTools = TOOLS;

  protected readonly menuOpen = signal(false);
  /** True once the page has scrolled, used to deepen the header's backdrop. */
  protected readonly scrolled = signal(false);

  constructor() {
    const document = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const view = document.defaultView;
      if (!view) {
        return;
      }
      const onScroll = () => this.scrolled.set(view.scrollY > 8);
      onScroll();
      view.addEventListener('scroll', onScroll, { passive: true });
      destroyRef.onDestroy(() => view.removeEventListener('scroll', onScroll));
    });

    // Collapse the mobile menu whenever a navigation completes.
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
