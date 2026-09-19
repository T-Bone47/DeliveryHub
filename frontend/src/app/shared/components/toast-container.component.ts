import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ToastService } from './toast.service';

@Component({
  selector: 'dh-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack" role="status" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast-' + toast.kind">
          <span>{{ toast.message }}</span>
          <button type="button" class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Dismiss notification">
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      top: var(--space-5);
      right: var(--space-5);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      z-index: 1000;
      max-width: 360px;
    }
    .toast {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      font-size: 13.5px;
      font-weight: 500;
      color: #fff;
      animation: slide-in 0.15s ease-out;
    }
    .toast-success { background: var(--color-success); }
    .toast-error { background: var(--color-error); }
    .toast-info { background: var(--color-primary); }
    .toast-close {
      background: none;
      border: none;
      color: inherit;
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      opacity: 0.85;
      padding: 0;
    }
    .toast-close:hover { opacity: 1; }
    @keyframes slide-in {
      from { transform: translateX(16px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @media (max-width: 480px) {
      .toast-stack { left: var(--space-4); right: var(--space-4); max-width: none; }
    }
  `],
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
