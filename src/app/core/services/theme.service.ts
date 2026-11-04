import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'imagetools-theme';

/**
 * Light/dark theme state.
 *
 * `index.html` applies the stored preference before first paint; this service
 * keeps it in sync afterwards and follows the OS when the user has not chosen.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly preferenceState = signal<ThemePreference>('system');
  private readonly systemPrefersDark = signal(false);

  readonly preference = this.preferenceState.asReadonly();

  readonly isDark = computed(() => {
    const preference = this.preferenceState();
    return preference === 'system' ? this.systemPrefersDark() : preference === 'dark';
  });

  constructor() {
    if (!this.isBrowser) {
      return;
    }

    const media = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)');
    if (media) {
      this.systemPrefersDark.set(media.matches);
      media.addEventListener('change', (event) => this.systemPrefersDark.set(event.matches));
    }

    this.preferenceState.set(this.readStoredPreference());
    this.applyToDocument();
  }

  toggle(): void {
    this.setPreference(this.isDark() ? 'light' : 'dark');
  }

  setPreference(preference: ThemePreference): void {
    this.preferenceState.set(preference);

    if (!this.isBrowser) {
      return;
    }

    try {
      if (preference === 'system') {
        this.document.defaultView?.localStorage.removeItem(STORAGE_KEY);
      } else {
        this.document.defaultView?.localStorage.setItem(STORAGE_KEY, preference);
      }
    } catch {
      // Private browsing or blocked storage — the choice just will not persist.
    }

    this.applyToDocument();
  }

  private applyToDocument(): void {
    this.document.documentElement.classList.toggle('dark', this.isDark());
    this.document.documentElement.style.colorScheme = this.isDark() ? 'dark' : 'light';
  }

  private readStoredPreference(): ThemePreference {
    try {
      const stored = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      return stored === 'dark' || stored === 'light' ? stored : 'system';
    } catch {
      return 'system';
    }
  }
}
