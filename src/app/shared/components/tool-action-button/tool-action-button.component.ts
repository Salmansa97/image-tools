import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { IconComponent, IconName } from '../icon/icon.component';

/** The primary "do the thing" button, with its own busy state. */
@Component({
  selector: 'app-tool-action-button',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <button
      type="button"
      (click)="activated.emit()"
      [disabled]="disabled() || busy()"
      [class]="
        variant() === 'primary'
          ? 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-3 text-sm font-bold text-white shadow-soft transition-all hover:shadow-lift hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50'
          : 'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-brand-500 dark:hover:text-brand-300'
      "
    >
      @if (busy()) {
        <app-icon name="spinner" [size]="17" svgClass="animate-spin" />
        {{ busyLabel() }}
      } @else {
        <app-icon [name]="icon()" [size]="17" />
        {{ label() }}
      }
    </button>
  `,
})
export class ToolActionButtonComponent {
  readonly label = input.required<string>();
  readonly busyLabel = input('Working…');
  readonly icon = input<IconName>('sparkles');
  readonly busy = input(false);
  readonly disabled = input(false);
  readonly variant = input<'primary' | 'secondary'>('primary');

  readonly activated = output<void>();
}
