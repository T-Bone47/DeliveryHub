import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'dh-access-restricted',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="restricted-page">
      <div class="restricted-card">
        <div class="icon-wrap">
          <dh-icon name="lock"></dh-icon>
        </div>
        <div class="badge">403 — Unauthorized Role</div>
        <h1>Access restricted</h1>
        <p class="desc">
          You don't have permission to access this area of DeliveryHub. Your active session is
          authorized for the <strong>{{ currentRole() }}</strong> portal only.
        </p>

        <div class="actions">
          <button type="button" class="btn btn-primary return-btn" (click)="returnToDashboard()">
            <span>Return to Dashboard</span>
            <dh-icon name="arrow-right"></dh-icon>
          </button>
          <button type="button" class="btn btn-secondary logout-btn" (click)="logout()">
            Sign out & Switch Account
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .restricted-page {
      min-height: 100vh;
      background: var(--color-background);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-4);
    }

    .restricted-card {
      width: 100%;
      max-width: 480px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-10) var(--space-8);
      text-align: center;
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--color-error-soft);
      color: var(--color-error);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: var(--space-4);
    }

    .icon-wrap ::ng-deep svg {
      width: 32px;
      height: 32px;
    }

    .badge {
      font-size: 11.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--color-error);
      background: var(--color-error-soft);
      padding: 3px 10px;
      border-radius: 999px;
      margin-bottom: var(--space-3);
    }

    h1 {
      font-size: 26px;
      font-weight: 800;
      color: var(--color-text);
      margin-bottom: var(--space-2);
    }

    .desc {
      font-size: 14px;
      color: var(--color-text-secondary);
      line-height: 1.5;
      margin-bottom: var(--space-6);
    }

    .desc strong {
      color: var(--color-text);
    }

    .actions {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .return-btn, .logout-btn {
      width: 100%;
      padding: 12px 18px;
      font-size: 14px;
    }
  `],
})
export class AccessRestrictedComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentRole = () => this.auth.role() ?? 'ANONYMOUS';

  returnToDashboard(): void {
    this.router.navigateByUrl(this.auth.redirectPathForRole());
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
