import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from './icon.component';

@Component({
  selector: 'dh-stat-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="stat-card" [class]="'tone-' + tone">
      <div class="stat-header">
        <span class="stat-label">{{ label }}</span>
        @if (icon) {
          <span class="stat-icon-box">
            <dh-icon [name]="icon"></dh-icon>
          </span>
        }
      </div>
      <div class="stat-main">
        <span class="stat-value">{{ value }}</span>
        @if (hint) { <span class="stat-hint">{{ hint }}</span> }
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: var(--space-2);
      padding: var(--space-5);
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-sm);
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    }
    .stat-card:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--color-border-strong);
    }
    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
    }
    .stat-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .stat-icon-box {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-sm);
      background: var(--color-primary-soft);
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .stat-main {
      display: flex;
      align-items: baseline;
      gap: var(--space-3);
      flex-wrap: wrap;
    }
    .stat-value {
      font-family: var(--font-display);
      font-size: 28px;
      font-weight: 700;
      color: var(--color-text);
      line-height: 1.1;
    }
    .stat-hint {
      font-size: 12px;
      color: var(--color-muted);
      font-weight: 500;
    }

    .tone-warning {
      border-color: rgba(217, 119, 6, 0.3);
      background: linear-gradient(to bottom, #fff, #fffbeb);
      .stat-icon-box { background: var(--color-warning-soft); color: var(--color-warning); }
      .stat-value { color: var(--color-warning); }
    }
    .tone-success {
      .stat-icon-box { background: var(--color-success-soft); color: var(--color-success); }
    }
    .tone-error {
      border-color: rgba(220, 38, 38, 0.3);
      background: linear-gradient(to bottom, #fff, #fef2f2);
      .stat-icon-box { background: var(--color-error-soft); color: var(--color-error); }
      .stat-value { color: var(--color-error); }
    }
  `],
})
export class StatCardComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value: string | number = '';
  @Input() hint = '';
  @Input() icon = '';
  @Input() tone: 'neutral' | 'success' | 'warning' | 'error' = 'neutral';
}
