import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'dh-portal-select',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <div class="portal-page">
      <header class="portal-header">
        <div class="brand">
          <span class="brand-mark">DH</span>
          <span class="brand-title">DeliveryHub</span>
        </div>
        <div class="header-status">
          <span class="status-indicator"></span>
          <span>System Operational</span>
        </div>
      </header>

      <main class="portal-container">
        <div class="hero-section">
          <div class="platform-eyebrow">Logistics Operations Platform</div>
          <h1 class="main-title">Welcome to DeliveryHub</h1>
          <p class="main-subtitle">
            One delivery platform. Three operational experiences. Choose how you want to continue.
          </p>
        </div>

        <div class="portal-grid">
          <!-- Customer Portal Card -->
          <div class="portal-card customer-card">
            <div class="card-top">
              <div class="card-icon-wrap customer-icon">
                <dh-icon name="package"></dh-icon>
              </div>
              <span class="card-role-tag">Customer</span>
            </div>
            
            <h2 class="card-title">Track &amp; Send Deliveries</h2>
            <p class="card-desc">
              Book courier dispatches, track active parcels along route corridors, and inspect verified digital delivery receipts.
            </p>

            <div class="card-action-zone">
              <a routerLink="/customer/login" class="btn btn-primary portal-btn">
                <span>Continue as Customer</span>
                <dh-icon name="arrow-right"></dh-icon>
              </a>
              <a routerLink="/customer/register" class="sublink">
                New to DeliveryHub? <strong>Register account</strong>
              </a>
            </div>
          </div>

          <!-- Agent Portal Card -->
          <div class="portal-card agent-card">
            <div class="card-top">
              <div class="card-icon-wrap agent-icon">
                <dh-icon name="truck"></dh-icon>
              </div>
              <span class="card-role-tag">Courier Agent</span>
            </div>

            <h2 class="card-title">Manage Deliveries</h2>
            <p class="card-desc">
              Review assigned manifests, update transit waypoints, verify recipient OTP handovers, and submit photographic proof of delivery.
            </p>

            <div class="card-action-zone">
              <a routerLink="/agent/login" class="btn btn-secondary portal-btn">
                <span>Continue as Agent</span>
                <dh-icon name="arrow-right"></dh-icon>
              </a>
              <span class="subtext">
                Courier accounts are provisioned by operations administration.
              </span>
            </div>
          </div>

          <!-- Admin Portal Card -->
          <div class="portal-card admin-card">
            <div class="card-top">
              <div class="card-icon-wrap admin-icon">
                <dh-icon name="shield"></dh-icon>
              </div>
              <span class="card-role-tag">Administration</span>
            </div>

            <h2 class="card-title">Operate the Platform</h2>
            <p class="card-desc">
              Real-time fleet monitoring, multi-factor courier assignment engine, regional hub controls, and exception triage.
            </p>

            <div class="card-action-zone">
              <a routerLink="/admin/login" class="btn btn-secondary portal-btn">
                <span>Continue as Admin</span>
                <dh-icon name="arrow-right"></dh-icon>
              </a>
              <span class="subtext">
                Authorized platform operations credentials required.
              </span>
            </div>
          </div>
        </div>

        <!-- Evaluation & Demo Reference Drawer -->
        <div class="demo-drawer" [class.open]="showDemoAccounts()">
          <button 
            type="button" 
            class="demo-drawer-toggle" 
            (click)="toggleDemoAccounts()"
            [attr.aria-expanded]="showDemoAccounts()"
          >
            <dh-icon name="info"></dh-icon>
            <span>Pre-Configured Demo Credentials (Evaluation)</span>
            <dh-icon [name]="showDemoAccounts() ? 'chevron-up' : 'chevron-down'"></dh-icon>
          </button>

          @if (showDemoAccounts()) {
            <div class="demo-drawer-body">
              <div class="demo-grid">
                <div class="demo-card">
                  <div class="demo-card-head">
                    <span class="demo-role-badge customer">Customer</span>
                    <a routerLink="/customer/login" class="demo-quick-link">Sign In →</a>
                  </div>
                  <div class="demo-credential">
                    <span class="cred-label">Email:</span>
                    <code class="cred-val">customer&#64;demo.local</code>
                  </div>
                  <div class="demo-credential">
                    <span class="cred-label">Password:</span>
                    <code class="cred-val">Customer&#64;123</code>
                  </div>
                </div>

                <div class="demo-card">
                  <div class="demo-card-head">
                    <span class="demo-role-badge agent">Courier Agent</span>
                    <a routerLink="/agent/login" class="demo-quick-link">Sign In →</a>
                  </div>
                  <div class="demo-credential">
                    <span class="cred-label">Email:</span>
                    <code class="cred-val">agent1&#64;demo.local</code>
                  </div>
                  <div class="demo-credential">
                    <span class="cred-label">Password:</span>
                    <code class="cred-val">Agent&#64;123</code>
                  </div>
                </div>

                <div class="demo-card">
                  <div class="demo-card-head">
                    <span class="demo-role-badge admin">Administrator</span>
                    <a routerLink="/admin/login" class="demo-quick-link">Sign In →</a>
                  </div>
                  <div class="demo-credential">
                    <span class="cred-label">Email:</span>
                    <code class="cred-val">admin&#64;demo.local</code>
                  </div>
                  <div class="demo-credential">
                    <span class="cred-label">Password:</span>
                    <code class="cred-val">Admin&#64;123</code>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </main>

      <footer class="portal-footer">
        <div class="footer-inner">
          <span>&copy; {{ currentYear }} DeliveryHub Technologies Inc. All rights reserved.</span>
          <span class="footer-divider">&bull;</span>
          <span>Security &amp; Audit Compliant Logistics Infrastructure</span>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .portal-page {
      min-height: 100vh;
      background: var(--color-background);
      display: flex;
      flex-direction: column;
    }

    .portal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-8);
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: var(--space-3);
    }

    .brand-mark {
      width: 34px;
      height: 34px;
      background: var(--color-primary);
      color: #ffffff;
      border-radius: var(--radius-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: -0.3px;
    }

    .brand-title {
      font-family: var(--font-display);
      font-size: 19px;
      font-weight: 800;
      color: var(--color-text);
      letter-spacing: -0.02em;
    }

    .header-status {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 12px;
      font-weight: 600;
      color: var(--color-success);
      background: var(--color-success-soft);
      padding: 4px 10px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(16, 185, 129, 0.25);
    }

    .status-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-success);
    }

    .portal-container {
      width: 100%;
      max-width: 1120px;
      margin: 0 auto;
      padding: var(--space-12) var(--space-6) var(--space-8);
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .hero-section {
      text-align: center;
      max-width: 640px;
      margin: 0 auto var(--space-10);
    }

    .platform-eyebrow {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-primary);
      background: var(--color-primary-soft);
      padding: 3px 12px;
      border-radius: var(--radius-full);
      margin-bottom: var(--space-3);
    }

    .main-title {
      font-size: 32px;
      font-weight: 800;
      color: var(--color-text);
      line-height: 1.25;
      letter-spacing: -0.025em;
      margin-bottom: var(--space-3);
    }

    .main-subtitle {
      font-size: 15px;
      color: var(--color-text-secondary);
      line-height: 1.55;
    }

    .portal-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .portal-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-8) var(--space-7);
      display: flex;
      flex-direction: column;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }

    .portal-card:hover {
      border-color: var(--color-primary);
      box-shadow: 0 10px 28px -4px rgba(15, 23, 42, 0.08);
      transform: translateY(-2px);
    }

    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-5);
    }

    .card-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-icon-wrap dh-icon {
      width: 22px;
      height: 22px;
      display: inline-flex;
    }

    .customer-icon {
      background: var(--color-primary-soft);
      color: var(--color-primary);
    }

    .agent-icon {
      background: #eff6ff;
      color: #2563eb;
    }

    .admin-icon {
      background: #f1f5f9;
      color: #334155;
    }


    .card-icon-wrap ::ng-deep svg {
      width: 22px;
      height: 22px;
    }

    .card-role-tag {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--color-muted);
      background: #f8fafc;
      padding: 3px 8px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--color-border);
    }

    .card-title {
      font-size: 19px;
      font-weight: 700;
      color: var(--color-text);
      line-height: 1.3;
      margin-bottom: var(--space-3);
      letter-spacing: -0.015em;
    }

    .card-desc {
      font-size: 13.5px;
      color: var(--color-text-secondary);
      line-height: 1.55;
      margin-bottom: var(--space-6);
      flex: 1;
    }

    .card-action-zone {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding-top: var(--space-5);
      border-top: 1px solid var(--color-border-light);
    }

    .portal-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: 11px 16px;
      border-radius: var(--radius-sm);
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.15s ease;
    }

    .portal-btn:hover {
      text-decoration: none;
    }

    .sublink {
      font-size: 12px;
      color: var(--color-text-secondary);
      text-align: center;
      text-decoration: none;
      padding: 2px 0;
    }

    .sublink strong {
      color: var(--color-primary);
      font-weight: 600;
    }

    .sublink:hover {
      text-decoration: underline;
    }

    .subtext {
      font-size: 11.5px;
      color: var(--color-muted);
      text-align: center;
      line-height: 1.4;
      padding: 2px 0;
    }

    /* Demo Drawer */
    .demo-drawer {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-top: var(--space-4);
      box-shadow: var(--shadow-sm);
    }

    .demo-drawer-toggle {
      width: 100%;
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 12px 18px;
      background: #f8fafc;
      border: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text);
      text-align: left;
      transition: background 0.15s ease;
    }

    .demo-drawer-toggle:hover {
      background: #f1f5f9;
    }

    .demo-drawer-toggle dh-icon:first-child {
      color: var(--color-primary);
    }

    .demo-drawer-toggle dh-icon:last-child {
      margin-left: auto;
      color: var(--color-muted);
    }

    .demo-drawer-body {
      padding: var(--space-5);
      border-top: 1px solid var(--color-border);
    }

    .demo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-4);
    }

    .demo-card {
      background: #f8fafc;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .demo-card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 2px;
    }

    .demo-role-badge {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 6px;
      border-radius: var(--radius-sm);
    }

    .demo-role-badge.customer {
      background: var(--color-primary-soft);
      color: var(--color-primary);
    }

    .demo-role-badge.agent {
      background: #eff6ff;
      color: #2563eb;
    }

    .demo-role-badge.admin {
      background: #f1f5f9;
      color: #334155;
    }

    .demo-quick-link {
      font-size: 11.5px;
      font-weight: 600;
      color: var(--color-primary);
      text-decoration: none;
    }

    .demo-quick-link:hover {
      text-decoration: underline;
    }

    .demo-credential {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
    }

    .cred-label {
      color: var(--color-text-secondary);
    }

    .cred-val {
      font-family: var(--font-mono);
      font-size: 11px;
      background: #ffffff;
      border: 1px solid var(--color-border);
      padding: 1px 5px;
      border-radius: 3px;
      color: var(--color-text);
    }

    .portal-footer {
      padding: var(--space-5) var(--space-8);
      background: var(--color-surface);
      border-top: 1px solid var(--color-border);
      margin-top: auto;
    }

    .footer-inner {
      max-width: 1120px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      font-size: 12.5px;
      color: var(--color-muted);
    }

    .footer-divider {
      color: var(--color-border);
    }

    @media (max-width: 960px) {
      .portal-grid {
        grid-template-columns: 1fr;
        max-width: 460px;
        margin-left: auto;
        margin-right: auto;
      }

      .demo-grid {
        grid-template-columns: 1fr;
      }

      .main-title {
        font-size: 26px;
      }

      .footer-inner {
        flex-direction: column;
        gap: 4px;
        text-align: center;
      }

      .footer-divider {
        display: none;
      }
    }
  `],
})
export class PortalSelectComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly showDemoAccounts = signal(false);
  readonly currentYear = new Date().getFullYear();

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.router.navigateByUrl(this.auth.redirectPathForRole());
    }
  }

  toggleDemoAccounts(): void {
    this.showDemoAccounts.update((v) => !v);
  }
}

