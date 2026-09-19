import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dh-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open) {
      <div class="overlay" (click)="cancel.emit()">
        <div class="dialog" role="alertdialog" aria-modal="true" [attr.aria-label]="title" (click)="$event.stopPropagation()">
          <h3>{{ title }}</h3>
          <p>{{ message }}</p>
          <div class="actions">
            <button type="button" class="btn btn-ghost" (click)="cancel.emit()">{{ cancelLabel }}</button>
            <button type="button" [class]="danger ? 'btn btn-danger' : 'btn btn-primary'" (click)="confirm.emit()">
              {{ confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(20, 24, 33, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1100;
      padding: var(--space-4);
    }
    .dialog {
      background: var(--color-surface);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      max-width: 380px;
      width: 100%;
      box-shadow: var(--shadow-lg);
    }
    .dialog h3 { font-size: 16px; margin-bottom: var(--space-2); }
    .dialog p { color: var(--color-text-secondary); font-size: 13.5px; margin-bottom: var(--space-5); }
    .actions { display: flex; justify-content: flex-end; gap: var(--space-3); }
  `],
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'Are you sure?';
  @Input() message = 'This action cannot be undone.';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() danger = false;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
