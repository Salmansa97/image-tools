import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';

import { ImageWorkerService } from '../../core/services/image-worker.service';
import { formatBytes, savingsPercent } from '../../core/utilities/file.utils';
import { IconComponent } from '../../shared/components/icon/icon.component';

/**
 * A working demonstration of the compressor, running in the hero.
 *
 * The sample is drawn on a canvas at runtime rather than bundled, so it costs
 * no download, and it is then put through the *same* pipeline every tool uses.
 * The sizes shown are therefore real measurements of this visitor's browser
 * compressing a real image — which is the whole claim the page is making, so
 * it would be poor form to fake it.
 */
@Component({
  selector: 'app-hero-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  imports: [IconComponent],
  template: `
    <figure
      class="glow-ring relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-3 shadow-glow backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60"
    >
      <div class="checkerboard relative aspect-16/10 overflow-hidden rounded-2xl">
        @if (state() === 'ready') {
          <!-- Compressed result underneath, original revealed by the wipe -->
          <img
            [src]="compressedUrl()!"
            alt="The same photograph after compression"
            class="absolute inset-0 size-full object-cover"
          />
          <div class="animate-sweep-clip absolute inset-0">
            <img
              [src]="originalUrl()!"
              alt="A sample photograph before compression"
              class="absolute inset-0 size-full object-cover"
            />
          </div>

          <div
            class="animate-sweep absolute inset-y-0 w-[2px] bg-white/90 shadow-[0_0_14px_rgba(255,255,255,0.8)]"
          >
            <span
              class="absolute top-1/2 left-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-700 shadow-lift"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="m9 6-6 6 6 6M15 6l6 6-6 6" />
              </svg>
            </span>
          </div>

          <span
            class="absolute top-3 left-3 rounded-lg bg-slate-900/80 px-2 py-1 text-[11px] font-bold tracking-wide text-white uppercase backdrop-blur-sm"
          >
            Before · {{ originalLabel() }}
          </span>
          <span
            class="absolute top-3 right-3 rounded-lg bg-brand-600/90 px-2 py-1 text-[11px] font-bold tracking-wide text-white uppercase backdrop-blur-sm"
          >
            After · {{ compressedLabel() }}
          </span>
        } @else if (state() === 'working') {
          <div class="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <span class="relative flex size-12 items-center justify-center">
              <span class="animate-pulse-ring absolute inset-0 rounded-full bg-brand-500/40"></span>
              <app-icon
                name="spinner"
                [size]="26"
                svgClass="animate-spin"
                class="text-brand-600 dark:text-brand-400"
              />
            </span>
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Compressing a sample in your browser…
            </p>
          </div>
        } @else {
          <div class="absolute inset-0 flex items-center justify-center">
            <p class="px-6 text-center text-xs text-slate-500 dark:text-slate-400">
              Drop an image above to see this on your own photo.
            </p>
          </div>
        }
      </div>

      @if (state() === 'ready') {
        <figcaption class="flex items-center justify-between gap-4 px-2 pt-3 pb-1">
          <div class="flex items-baseline gap-2">
            <span class="text-sm text-slate-400 line-through dark:text-slate-500">
              {{ originalLabel() }}
            </span>
            <app-icon name="arrow-right" [size]="13" class="text-slate-300 dark:text-slate-600" />
            <span class="text-base font-extrabold text-slate-900 dark:text-white">
              {{ compressedLabel() }}
            </span>
          </div>

          <span
            class="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-extrabold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          >
            −{{ saved() }}% smaller
          </span>
        </figcaption>

        <p class="px-2 pb-1 text-[11px] text-slate-400 dark:text-slate-500">
          Live result — compressed by your browser just now, nothing uploaded.
        </p>
      }
    </figure>
  `,
})
export class HeroDemoComponent {
  private readonly workers = inject(ImageWorkerService);

  protected readonly state = signal<'idle' | 'working' | 'ready'>('idle');
  protected readonly originalUrl = signal<string | null>(null);
  protected readonly compressedUrl = signal<string | null>(null);
  private readonly originalSize = signal(0);
  private readonly compressedSize = signal(0);

  protected readonly originalLabel = computed(() => formatBytes(this.originalSize()));
  protected readonly compressedLabel = computed(() => formatBytes(this.compressedSize()));
  protected readonly saved = computed(() =>
    savingsPercent(this.originalSize(), this.compressedSize()),
  );

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      void this.run();
    });

    destroyRef.onDestroy(() => {
      for (const url of [this.originalUrl(), this.compressedUrl()]) {
        if (url) {
          URL.revokeObjectURL(url);
        }
      }
    });
  }

  private async run(): Promise<void> {
    try {
      this.state.set('working');

      const source = await this.drawSample();
      this.originalUrl.set(URL.createObjectURL(source));
      this.originalSize.set(source.size);

      const output = await this.workers.process(source, {
        kind: 'compress',
        // Deliberately punchy so the difference is visible at a glance, and
        // honest about it: the caption says this is a live compression.
        quality: 32,
        format: 'image/jpeg',
        maxDimension: null,
        background: '#ffffff',
      });

      this.compressedUrl.set(URL.createObjectURL(output.blob));
      this.compressedSize.set(output.blob.size);
      this.state.set('ready');
    } catch {
      // The hero is decoration; if anything fails the page carries on without it.
      this.state.set('idle');
    }
  }

  /**
   * Paints a photographic-looking sample: smooth gradients with soft-edged
   * shapes and fine noise, which is the kind of content JPEG actually has to
   * work at. A flat graphic would compress unrealistically well.
   */
  private drawSample(): Promise<Blob> {
    const width = 1200;
    const height = 750;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return Promise.reject(new Error('no canvas'));
    }

    const sky = ctx.createLinearGradient(0, 0, width * 0.4, height);
    sky.addColorStop(0, '#1e1b4b');
    sky.addColorStop(0.45, '#7c3aed');
    sky.addColorStop(0.75, '#ec4899');
    sky.addColorStop(1, '#fb923c');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Soft light pools.
    for (let i = 0; i < 14; i += 1) {
      const x = (i * 137) % width;
      const y = (i * 89) % height;
      const r = 90 + ((i * 53) % 220);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
      glow.addColorStop(0, `hsla(${(i * 47) % 360}, 90%, 72%, 0.5)`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // A horizon band and silhouettes give the encoder real edges to handle.
    const ground = ctx.createLinearGradient(0, height * 0.62, 0, height);
    ground.addColorStop(0, 'rgba(15,23,42,0.15)');
    ground.addColorStop(1, 'rgba(2,6,23,0.92)');
    ctx.fillStyle = ground;
    ctx.fillRect(0, height * 0.62, width, height * 0.38);

    ctx.fillStyle = 'rgba(2,6,23,0.85)';
    for (let i = 0; i < 9; i += 1) {
      const w = 60 + ((i * 37) % 110);
      const h = 70 + ((i * 97) % 240);
      ctx.fillRect(i * 140 - 20, height - h, w, h);
    }

    // Fine grain, so the sample is not trivially compressible.
    const noise = ctx.getImageData(0, 0, width, height);
    for (let i = 0; i < noise.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 26;
      noise.data[i] += n;
      noise.data[i + 1] += n;
      noise.data[i + 2] += n;
    }
    ctx.putImageData(noise, 0, 0);

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          canvas.width = 0;
          canvas.height = 0;
          blob ? resolve(blob) : reject(new Error('encode failed'));
        },
        'image/jpeg',
        0.98,
      );
    });
  }
}
