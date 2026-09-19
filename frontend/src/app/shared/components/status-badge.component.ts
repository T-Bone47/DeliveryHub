import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

const DELIVERY_STATUS_TONES: Record<string, StatusTone> = {
  PENDING: 'neutral',
  AGENT_ASSIGNED: 'info',
  PICKED_UP: 'info',
  IN_TRANSIT: 'info',
  OUT_FOR_DELIVERY: 'info',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CONFIRMED: 'success',
  CANCELLED: 'error',
  FAILED: 'error',
  RESCHEDULED: 'warning',
  AVAILABLE: 'success',
  BUSY: 'warning',
  OFFLINE: 'neutral',
  SUSPENDED: 'error',
  ACTIVE: 'success',
  INACTIVE: 'neutral',
};

/** Renders a status pill with color + text + icon symbol (WCAG accessible status communication). */
@Component({
  selector: 'dh-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [class]="'tone-' + tone()" [attr.aria-label]="label() + ' status'">
      <span class="badge-icon" aria-hidden="true">{{ symbol() }}</span>
      <span class="badge-text">{{ label() }}</span>
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 2.5px 8px;
      border-radius: var(--radius-sm);
      font-size: 11.5px;
      font-weight: 600;
      letter-spacing: 0.015em;
      white-space: nowrap;
      line-height: 1.35;
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .badge-icon {
      font-size: 10px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .tone-neutral {
      background: var(--color-surface-muted, #f8fafc);
      color: var(--color-text-secondary);
      border: 1px solid var(--color-border);
    }

    .tone-info {
      background: var(--color-info-soft, #eff6ff);
      color: var(--color-info-text, #1e40af);
      border: 1px solid rgba(37, 99, 235, 0.2);
    }

    .tone-success {
      background: var(--color-success-soft, #ecfdf5);
      color: var(--color-success-text, #15803d);
      border: 1px solid rgba(22, 163, 74, 0.2);
    }

    .tone-warning {
      background: var(--color-warning-soft, #fffbeb);
      color: var(--color-warning-text, #b45309);
      border: 1px solid rgba(217, 119, 6, 0.2);
    }

    .tone-error {
      background: var(--color-error-soft, #fef2f2);
      color: var(--color-error-text, #b91c1c);
      border: 1px solid rgba(220, 38, 38, 0.2);
    }
  `],
})
export class StatusBadgeComponent {
  private readonly statusValue = signal<string>('');

  @Input({ required: true })
  set status(value: string) {
    this.statusValue.set(value ?? '');
  }

  readonly tone = computed<StatusTone>(() => DELIVERY_STATUS_TONES[this.statusValue()] ?? 'neutral');

  readonly symbol = computed(() => {
    const s = this.statusValue();
    switch (s) {
      case 'DELIVERED':
      case 'COMPLETED':
      case 'CONFIRMED':
      case 'ACTIVE':
      case 'AVAILABLE':
        return '✓';
      case 'OUT_FOR_DELIVERY':
      case 'IN_TRANSIT':
      case 'PICKED_UP':
      case 'AGENT_ASSIGNED':
        return '●';
      case 'RESCHEDULED':
        return '↺';
      case 'BUSY':
        return '▲';
      case 'FAILED':
      case 'CANCELLED':
      case 'SUSPENDED':
        return '×';
      case 'PENDING':
      case 'OFFLINE':
      case 'INACTIVE':
      default:
        return '○';
    }
  });

  readonly label = computed(() =>
    this.statusValue()
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' '),
  );
}
