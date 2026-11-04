import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ThemeService } from './core/services/theme.service';
import { FooterComponent } from './layout/footer/footer.component';
import { HeaderComponent } from './layout/header/header.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <div class="flex min-h-dvh flex-col">
      <app-header />

      <main id="main-content" class="flex-1" tabindex="-1">
        <router-outlet />
      </main>

      <app-footer />
    </div>
  `,
})
export class App {
  constructor() {
    // Eagerly instantiated so the stored theme preference is applied, and kept
    // in sync with the OS, for the whole session.
    inject(ThemeService);
  }
}
