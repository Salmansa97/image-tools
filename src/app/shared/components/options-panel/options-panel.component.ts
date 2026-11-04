import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { IconComponent } from '../icon/icon.component';

/**
 * The sticky options card every tool shows beside its canvas.
 *
 * Also carries the privacy line, so that claim is rendered from one place rather
 * than being retyped — and stays accurate — on every tool page.
 */
@Component({
  selector: 'app-options-panel',
  host: { class: 'block' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <div
      class="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft lg:sticky lg:top-24 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 class="text-base font-bold">{{ heading() }}</h2>

      <ng-content />

      @if (showPrivacyNote()) {
        <p class="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
          <app-icon name="lock" [size]="14" class="mt-px shrink-0" />
          Your images never leave your device.
        </p>
      }
    </div>
  `,
})
export class OptionsPanelComponent {
  readonly heading = input.required<string>();
  readonly showPrivacyNote = input(true);
}
