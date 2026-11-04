import { Injectable, signal } from '@angular/core';

/**
 * Carries files dropped on the home page across the navigation into a tool.
 *
 * `File` objects cannot travel through the router, and re-prompting the user to
 * pick the same images again would be a poor experience, so the selection is
 * parked here and claimed exactly once by the destination tool.
 */
@Injectable({ providedIn: 'root' })
export class UploadHandoffService {
  private readonly pending = signal<readonly File[]>([]);

  readonly hasPending = () => this.pending().length > 0;

  stage(files: readonly File[]): void {
    this.pending.set([...files]);
  }

  /** Returns the staged files and clears them, so a reload starts empty. */
  claim(): readonly File[] {
    const files = this.pending();
    if (files.length > 0) {
      this.pending.set([]);
    }
    return files;
  }

  discard(): void {
    this.pending.set([]);
  }
}
