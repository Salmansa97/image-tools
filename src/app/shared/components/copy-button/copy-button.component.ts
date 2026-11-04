import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { IconComponent } from '../icon/icon.component';

/**
 * Copies a string to the clipboard, with a confirmation.
 *
 * Falls back to a hidden textarea and `execCommand` where the async Clipboard API
 * is unavailable or blocked — notably Safari outside a user gesture and any page
 * served over plain HTTP.
 */
@Component({
  selector: 'app-copy-button',
  host: { class: 'inline-flex' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <button type="button" (click)="copy()" [class]="classes()" [attr.aria-label]="ariaLabel()">
      <app-icon [name]="copied() ? 'check' : 'copy'" [size]="size() === 'sm' ? 14 : 16" />
      <span>{{ copied() ? 'Copied' : label() }}</span>
    </button>
  `,
})
export class CopyButtonComponent {
  private readonly document = inject(DOCUMENT);

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  readonly value = input.required<string>();
  readonly label = input('Copy');
  readonly size = input<'sm' | 'md'>('md');
  readonly ariaLabel = input<string | null>(null);

  private readonly copiedState = signal(false);
  protected readonly copied = this.copiedState.asReadonly();

  protected readonly classes = computed(() => {
    const base =
      'inline-flex items-center gap-1.5 rounded-lg border font-semibold transition-colors disabled:opacity-50';
    const sizing = this.size() === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm';
    const tone = this.copiedState()
      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300'
      : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-brand-300';
    return `${base} ${sizing} ${tone}`;
  });

  protected async copy(): Promise<void> {
    const text = this.value();

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        this.copyWithFallback(text);
      }
      this.confirm();
    } catch {
      try {
        this.copyWithFallback(text);
        this.confirm();
      } catch {
        // Clipboard access is blocked entirely; the value stays selectable on screen.
      }
    }
  }

  private copyWithFallback(text: string): void {
    const textarea = this.document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    this.document.body.appendChild(textarea);
    textarea.select();
    this.document.execCommand('copy');
    textarea.remove();
  }

  private confirm(): void {
    this.copiedState.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.copiedState.set(false), 2000);
  }
}
