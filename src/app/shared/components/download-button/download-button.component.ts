import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { FileDownloadService } from '../../../core/services/file-download.service';
import { IconComponent } from '../icon/icon.component';

export type DownloadButtonVariant = 'primary' | 'secondary' | 'ghost';
export type DownloadButtonSize = 'sm' | 'md' | 'lg';

/** Saves a blob produced on this device, with a brief confirmation afterwards. */
@Component({
  selector: 'app-download-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <button
      type="button"
      [disabled]="disabled() || !blob()"
      (click)="download()"
      [class]="classes()"
      [attr.aria-label]="ariaLabel()"
    >
      <app-icon [name]="justSaved() ? 'check' : 'download'" [size]="iconSize()" />
      <span>{{ justSaved() ? savedLabel() : label() }}</span>
    </button>
  `,
})
export class DownloadButtonComponent {
  private readonly downloads = inject(FileDownloadService);

  private savedTimer: ReturnType<typeof setTimeout> | undefined;

  readonly blob = input<Blob | null>(null);
  readonly fileName = input.required<string>();
  readonly label = input('Download');
  readonly savedLabel = input('Saved');
  readonly variant = input<DownloadButtonVariant>('primary');
  readonly size = input<DownloadButtonSize>('md');
  readonly disabled = input(false);
  readonly fullWidth = input(false);

  private readonly saved = signal(false);

  protected readonly justSaved = this.saved.asReadonly();

  protected readonly ariaLabel = computed(() => `${this.label()} ${this.fileName()}`);

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.savedTimer));
  }

  protected readonly iconSize = computed(() =>
    this.size() === 'sm' ? 15 : this.size() === 'lg' ? 20 : 17,
  );

  protected readonly classes = computed(() => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]';

    const sizes: Record<DownloadButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    const variants: Record<DownloadButtonVariant, string> = {
      primary:
        'bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-soft hover:shadow-lift hover:brightness-110',
      secondary:
        'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-brand-500 dark:hover:text-brand-300',
      ghost: 'text-brand-700 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-500/10',
    };

    return [
      base,
      sizes[this.size()],
      variants[this.variant()],
      this.fullWidth() ? 'w-full' : '',
    ].join(' ');
  });

  protected download(): void {
    const blob = this.blob();
    if (!blob) {
      return;
    }
    this.downloads.downloadBlob(blob, this.fileName());
    this.saved.set(true);
    // Cleared on destroy so a navigation mid-countdown cannot write to a dead signal.
    clearTimeout(this.savedTimer);
    this.savedTimer = setTimeout(() => this.saved.set(false), 2200);
  }
}
