import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { IconComponent, IconName } from '../icon/icon.component';

export type AlertTone = 'info' | 'warning' | 'error' | 'success';

/** Inline message block used for warnings, errors and privacy notes. */
@Component({
  selector: 'app-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { class: 'block' },
  template: `
    <div [class]="containerClass()" [attr.role]="tone() === 'error' ? 'alert' : 'status'">
      <app-icon [name]="icon()" [size]="18" class="mt-px shrink-0" />
      <div class="min-w-0 flex-1 text-sm">
        @if (title()) {
          <p class="font-semibold">{{ title() }}</p>
        }
        <p [class]="title() ? 'mt-0.5 opacity-90' : ''"><ng-content /></p>
      </div>
    </div>
  `,
})
export class AlertComponent {
  readonly tone = input<AlertTone>('info');
  readonly title = input<string | null>(null);

  protected readonly icon = computed<IconName>(() => {
    switch (this.tone()) {
      case 'warning':
        return 'alert';
      case 'error':
        return 'alert';
      case 'success':
        return 'check';
      default:
        return 'info';
    }
  });

  protected readonly containerClass = computed(() => {
    const base = 'flex items-start gap-3 rounded-xl border px-4 py-3';
    switch (this.tone()) {
      case 'warning':
        return `${base} border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200`;
      case 'error':
        return `${base} border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200`;
      case 'success':
        return `${base} border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200`;
      default:
        return `${base} border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300`;
    }
  });
}
