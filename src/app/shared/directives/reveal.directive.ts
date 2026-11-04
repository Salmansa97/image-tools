import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/**
 * Fades an element up as it scrolls into view.
 *
 * The `.reveal` class is added by the directive itself rather than sitting in
 * the template, so content stays visible when JavaScript does not run — which
 * matters here because every page is prerendered and crawlers must still see
 * the copy. One shared `IntersectionObserver` per directive instance is cheap;
 * each unobserves itself after firing, so nothing keeps watching.
 */
@Directive({
  selector: '[appReveal]',
})
export class RevealDirective {
  private readonly host: ElementRef<HTMLElement> = inject(ElementRef);

  /** Stagger, in milliseconds, for items revealed as a group. */
  readonly appReveal = input<number | string>(0);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const element = this.host.nativeElement;

      const prefersReducedMotion =
        typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
        return;
      }

      const delay = Number(this.appReveal()) || 0;
      element.style.setProperty('--reveal-delay', `${delay}ms`);
      element.classList.add('reveal');

      // Already on screen at load: reveal on the next frame so the transition runs.
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              observer.unobserve(entry.target);
            }
          }
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
      );

      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
