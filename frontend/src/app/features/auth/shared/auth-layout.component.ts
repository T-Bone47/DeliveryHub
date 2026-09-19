import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'dh-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <div class="auth-wrapper">
      <div class="auth-container">
        <!-- Left Branding & Value Prop Column (Desktop) -->
        <aside class="auth-hero">
          <div class="hero-brand">
            <a routerLink="/" class="brand-link">
              <span class="brand-mark">DH</span>
              <span class="brand-name">DeliveryHub</span>
            </a>
          </div>

          <div class="hero-content">
            <div class="hero-tag">Logistics Operations Platform</div>
            <h1 class="hero-title">{{ headline }}</h1>
            <p class="hero-subtitle">{{ subheadline }}</p>

            <div class="hero-perks">
              <div class="perk-item">
                <div class="perk-icon"><dh-icon name="check"></dh-icon></div>
                <div>
                  <strong>Automated Courier Dispatch</strong>
                  <p>Intelligent multi-factor agent assignment with workload balancing.</p>
                </div>
              </div>
              <div class="perk-item">
                <div class="perk-icon"><dh-icon name="check"></dh-icon></div>
                <div>
                  <strong>Role-Separated Portals</strong>
                  <p>Dedicated operational consoles for Customers, Couriers, and Admins.</p>
                </div>
              </div>
              <div class="perk-item">
                <div class="perk-icon"><dh-icon name="check"></dh-icon></div>
                <div>
                  <strong>Audited Chain of Custody</strong>
                  <p>Live OTP verification, photographic POD, and milestone tracking.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="hero-footer">
            <span>&copy; {{ currentYear }} DeliveryHub Inc. End-to-end verified delivery network.</span>
          </div>
        </aside>

        <!-- Right Form Column -->
        <main class="auth-card-panel">
          <div class="mobile-brand-bar">
            <a routerLink="/" class="brand-link mobile-link">
              <span class="brand-mark">DH</span>
              <span class="brand-name">DeliveryHub</span>
            </a>
          </div>

          <div class="auth-card-inner">
            <ng-content></ng-content>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 100vh;
      background: var(--color-background);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-6) var(--space-4);
    }

    .auth-container {
      width: 100%;
      max-width: 1040px;
      min-height: 620px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: 0 20px 40px -8px rgba(15, 23, 42, 0.08);
      display: grid;
      grid-template-columns: 1.12fr 1fr;
      overflow: hidden;
    }

    .auth-hero {
      background: #0f172a;
      background-image: radial-gradient(at 100% 0%, rgba(30, 41, 59, 0.8) 0px, transparent 50%),
                        radial-gradient(at 0% 100%, rgba(15, 23, 42, 1) 0px, transparent 50%);
      color: #ffffff;
      padding: var(--space-10) var(--space-9);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
    }

    .brand-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-3);
      color: #ffffff;
      text-decoration: none;
    }

    .brand-mark {
      width: 36px;
      height: 36px;
      background: var(--color-primary);
      color: #ffffff;
      border-radius: var(--radius-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 14px;
      letter-spacing: -0.3px;
    }

    .brand-name {
      font-family: var(--font-display);
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .hero-content {
      margin: var(--space-6) 0;
    }

    .hero-tag {
      display: inline-block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-weight: 700;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.85);
      padding: 4px 11px;
      border-radius: var(--radius-full);
      border: 1px solid rgba(255, 255, 255, 0.12);
      margin-bottom: var(--space-4);
    }

    .hero-title {
      color: #ffffff;
      font-size: 28px;
      font-weight: 800;
      line-height: 1.3;
      letter-spacing: -0.02em;
      margin-bottom: var(--space-3);
    }

    .hero-subtitle {
      color: #94a3b8;
      font-size: 14.5px;
      line-height: 1.55;
      margin-bottom: var(--space-8);
    }

    .hero-perks {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .perk-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      font-size: 13.5px;
    }

    .perk-item strong {
      display: block;
      color: #f8fafc;
      font-size: 13.5px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .perk-item p {
      color: #94a3b8;
      font-size: 12.5px;
      line-height: 1.45;
      margin: 0;
    }

    .perk-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #10b981;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .perk-icon ::ng-deep svg {
      width: 12px;
      height: 12px;
    }

    .hero-footer {
      font-size: 11.5px;
      color: #64748b;
      line-height: 1.4;
    }

    .auth-card-panel {
      padding: var(--space-10) var(--space-8);
      display: flex;
      flex-direction: column;
      justify-content: center;
      background: var(--color-surface);
    }

    .mobile-brand-bar {
      display: none;
      margin-bottom: var(--space-6);
    }

    .mobile-link {
      color: var(--color-text);
    }

    .auth-card-inner {
      width: 100%;
      max-width: 400px;
      margin: 0 auto;
    }

    @media (max-width: 860px) {
      .auth-container {
        grid-template-columns: 1fr;
        max-width: 460px;
      }

      .auth-hero {
        display: none;
      }

      .mobile-brand-bar {
        display: flex;
        justify-content: center;
      }

      .auth-card-panel {
        padding: var(--space-8) var(--space-5);
      }
    }
  `],
})
export class AuthLayoutComponent {
  @Input() headline = 'Move every delivery with confidence.';
  @Input() subheadline = 'Connected. Controlled. One platform for every role in delivery operations.';

  readonly currentYear = new Date().getFullYear();
}

