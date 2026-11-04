import { Directive, output, signal } from '@angular/core';

import { filesFromDataTransfer } from '../../core/utilities/file.utils';

/**
 * Turns the host element into a drop target.
 *
 * Drag events fire for every child element, so a simple enter/leave pair flickers
 * constantly. Counting enters and leaves instead keeps the highlight stable while
 * the pointer moves across the zone's contents.
 */
@Directive({
  selector: '[appDragDrop]',
  exportAs: 'appDragDrop',
  host: {
    '(dragenter)': 'onDragEnter($event)',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
    '[class.is-dragging]': 'isDragging()',
  },
})
export class DragDropDirective {
  /** Files extracted from the drop, including the contents of dropped folders. */
  readonly filesDropped = output<File[]>();

  private depth = 0;
  private readonly draggingState = signal(false);

  readonly isDragging = this.draggingState.asReadonly();

  protected onDragEnter(event: DragEvent): void {
    if (!this.carriesFiles(event)) {
      return;
    }
    event.preventDefault();
    this.depth += 1;
    this.draggingState.set(true);
  }

  protected onDragOver(event: DragEvent): void {
    if (!this.carriesFiles(event)) {
      return;
    }
    // Without preventDefault the browser opens the file instead of dropping it.
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  protected onDragLeave(event: DragEvent): void {
    if (!this.carriesFiles(event)) {
      return;
    }
    event.preventDefault();
    this.depth = Math.max(0, this.depth - 1);
    if (this.depth === 0) {
      this.draggingState.set(false);
    }
  }

  protected async onDrop(event: DragEvent): Promise<void> {
    if (!event.dataTransfer) {
      return;
    }
    event.preventDefault();
    this.depth = 0;
    this.draggingState.set(false);

    const files = await filesFromDataTransfer(event.dataTransfer);
    if (files.length > 0) {
      this.filesDropped.emit(files);
    }
  }

  /** Ignores drags that carry text or links rather than files. */
  private carriesFiles(event: DragEvent): boolean {
    const types = event.dataTransfer?.types;
    if (!types) {
      return false;
    }
    return Array.from(types).includes('Files');
  }
}
