import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'dh-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty">
      <div class="empty-icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M3 7l3-4h12l3 4" />
          <path d="M9 11h6" />
        </svg>
      </div>
      <h3>{{ title }}</h3>
      @if (description) { <p>{{ description }}</p> }
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--space-2);
      padding: var(--space-10) var(--space-6);
      color: var(--color-text-secondary);
    }
    .empty-icon {
      color: var(--color-muted);
      margin-bottom: var(--space-2);
    }
    .empty h3 { font-size: 15px; color: var(--color-text); }
    .empty p { font-size: 13.5px; max-width: 360px; }
  `],
})
export class EmptyStateComponent {
  @Input() title = 'Nothing here yet';
  @Input() description = '';
}
