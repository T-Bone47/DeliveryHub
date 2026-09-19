import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dh-error-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-state">
      <div class="error-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5" />
          <path d="M12 16h.01" />
        </svg>
      </div>
      <h3>{{ title }}</h3>
      <p>{{ message }}</p>
      @if (retryable) {
        <button type="button" class="btn btn-secondary btn-sm" (click)="retry.emit()">Try again</button>
      }
    </div>
  `,
  styles: [`
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--space-2);
      padding: var(--space-10) var(--space-6);
      color: var(--color-text-secondary);
    }
    .error-icon { color: var(--color-error); margin-bottom: var(--space-2); }
    .error-state h3 { font-size: 15px; color: var(--color-text); }
    .error-state p { font-size: 13.5px; max-width: 360px; margin-bottom: var(--space-2); }
  `],
})
export class ErrorStateComponent {
  @Input() title = 'Something went wrong';
  @Input() message = 'Please try again in a moment.';
  @Input() retryable = true;
  @Output() retry = new EventEmitter<void>();
}
