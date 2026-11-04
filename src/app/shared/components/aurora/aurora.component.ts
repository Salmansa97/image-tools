import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Decorative animated colour field.
 *
 * Three blurred blobs drifting on long, offset cycles. Purely presentational —
 * `aria-hidden`, pointer-events disabled, and animation suppressed entirely
 * under `prefers-reduced-motion`.
 */
@Component({
  selector: 'app-aurora',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pointer-events-none absolute inset-0 -z-10 overflow-hidden',
    'aria-hidden': 'true',
  },
  template: `
    <div
      class="aurora-blob animate-drift"
      [class]="
        intensity() === 'strong' ? 'size-[34rem] sm:size-[46rem]' : 'size-[24rem] sm:size-[32rem]'
      "
      style="
        top: -14rem;
        left: -8rem;
        background: radial-gradient(circle at 30% 30%, var(--color-brand-400), transparent 70%);
      "
    ></div>

    <div
      class="aurora-blob animate-drift-slow"
      [class]="
        intensity() === 'strong' ? 'size-[30rem] sm:size-[42rem]' : 'size-[22rem] sm:size-[28rem]'
      "
      style="
        top: -10rem;
        right: -10rem;
        background: radial-gradient(circle at 70% 30%, var(--color-accent-400), transparent 70%);
      "
    ></div>

    @if (intensity() === 'strong') {
      <div
        class="aurora-blob animate-float size-[24rem] sm:size-[34rem]"
        style="
          bottom: -16rem;
          left: 38%;
          background: radial-gradient(circle at 50% 50%, var(--color-hot-400), transparent 70%);
          opacity: 0.3;
        "
      ></div>
    }
  `,
})
export class AuroraComponent {
  readonly intensity = input<'soft' | 'strong'>('soft');
}
