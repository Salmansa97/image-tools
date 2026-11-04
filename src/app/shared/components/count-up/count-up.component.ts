import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

/**
 * A number that counts up the first time it scrolls into view.
 *
 * Renders the final value immediately on the server and whenever motion is
 * reduced, so the prerendered HTML always contains the real figure rather than
 * a zero that only animates for people running JavaScript.
 */
@Component({
  selector: 'app-count-up',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-block tabular-nums' },
  template: `<span #root>{{ display() }}</span>`,
})
export class CountUpComponent {
  readonly value = input.required<number>();
  readonly prefix = input('');
  readonly suffix = input('');
  readonly durationMs = input(1400);
  readonly decimals = input(0);

  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  private readonly current = signal<number | null>(null);

  protected readonly display = computed(() => {
    const shown = this.current() ?? this.value();
    return `${this.prefix()}${shown.toFixed(this.decimals())}${this.suffix()}`;
  });

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const reduced =
        typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduced || typeof IntersectionObserver === 'undefined') {
        return;
      }

      let frame = 0;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) {
              continue;
            }
            observer.unobserve(entry.target);

            const target = this.value();
            const duration = this.durationMs();
            const start = performance.now();

            const step = (now: number) => {
              const progress = Math.min(1, (now - start) / duration);
              // Ease-out cubic: fast at first, settling onto the final value.
              const eased = 1 - (1 - progress) ** 3;
              this.current.set(target * eased);

              if (progress < 1) {
                frame = requestAnimationFrame(step);
              } else {
                this.current.set(target);
              }
            };

            this.current.set(0);
            frame = requestAnimationFrame(step);
          }
        },
        { threshold: 0.4 },
      );

      observer.observe(this.root().nativeElement);

      destroyRef.onDestroy(() => {
        observer.disconnect();
        cancelAnimationFrame(frame);
      });
    });
  }
}
