import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../core/services/auth.service';
import { AgentService } from '../../core/services/agent.service';
import { AgentView } from '../../core/models/agent.model';
import { StatusBadgeComponent } from './status-badge.component';
import { LoadingSpinnerComponent } from './loading-spinner.component';

@Component({
  selector: 'dh-profile-view',
  standalone: true,
  imports: [CommonModule, StatusBadgeComponent, LoadingSpinnerComponent],
  template: `
    <div class="page-header">
      <div>
        <h1>Profile</h1>
        <p class="subtitle">Your account information and role credentials on file with DeliveryHub.</p>
      </div>
    </div>

    <div class="profile-grid">
      <!-- General User Identity Card -->
      <div class="card profile-card">
        <div class="card-header">
          <h2>Account Details</h2>
          <span class="role-pill">{{ auth.currentUser()?.role }}</span>
        </div>

        <div class="profile-row">
          <span class="profile-label">Full name</span>
          <span class="profile-value">{{ auth.currentUser()?.fullName }}</span>
        </div>
        <div class="profile-row">
          <span class="profile-label">Email address</span>
          <span class="profile-value">{{ auth.currentUser()?.email }}</span>
        </div>
        <div class="profile-row">
          <span class="profile-label">Phone number</span>
          <span class="profile-value">{{ auth.currentUser()?.phone }}</span>
        </div>
        <div class="profile-row">
          <span class="profile-label">Assigned role</span>
          <div class="role-display">
            <span class="profile-value font-mono">{{ auth.currentUser()?.role }}</span>
            <span class="readonly-badge">Read-only</span>
          </div>
        </div>
        <div class="profile-row">
          <span class="profile-label">Account status</span>
          <dh-status-badge [status]="auth.currentUser()?.isActive ? 'ACTIVE' : 'INACTIVE'"></dh-status-badge>
        </div>
      </div>

      <!-- Agent Operational Details Card (Shown for AGENT role) -->
      @if (auth.role() === 'AGENT') {
        <div class="card profile-card">
          <div class="card-header">
            <h2>Courier Manifest & Metrics</h2>
            <span class="badge-accent">Operational</span>
          </div>

          @if (loadingAgent()) {
            <dh-loading-spinner message="Loading courier profile…"></dh-loading-spinner>
          } @else {
            @if (agent(); as ag) {
              <div class="profile-row">
                <span class="profile-label">Agent code</span>
                <span class="profile-value font-mono font-bold">{{ ag.agentCode }}</span>
              </div>
              <div class="profile-row">
                <span class="profile-label">Vehicle type</span>
                <span class="profile-value">{{ ag.vehicleType }}</span>
              </div>
              <div class="profile-row">
                <span class="profile-label">Current availability</span>
                <dh-status-badge [status]="ag.status"></dh-status-badge>
              </div>
              <div class="profile-row">
                <span class="profile-label">Customer rating</span>
                <span class="profile-value rating-val">&#9733; {{ ag.rating | number:'1.2-2' }} / 5.0</span>
              </div>
              <div class="profile-row">
                <span class="profile-label">Active dispatches</span>
                <span class="profile-value">{{ ag.activeDeliveries }} packages</span>
              </div>
              <div class="profile-row">
                <span class="profile-label">Completed deliveries</span>
                <span class="profile-value">{{ ag.completedDeliveries }}</span>
              </div>
              <div class="profile-row">
                <span class="profile-label">On-time deliveries</span>
                <span class="profile-value">{{ ag.onTimeDeliveries }}</span>
              </div>
              <div class="profile-row">
                <span class="profile-label">Reward points</span>
                <span class="profile-value points-val">+{{ ag.rewardPoints }} pts</span>
              </div>
            } @else {
              <p class="empty-note">Courier profile details are synchronizing.</p>
            }
          }
        </div>
      }

      <!-- Customer Account Summary (Shown for CUSTOMER role) -->
      @if (auth.role() === 'CUSTOMER') {
        <div class="card profile-card customer-info-card">
          <div class="card-header">
            <h2>Customer Account Details</h2>
          </div>
          <div class="customer-info-content">
            <p>
              Your verified Customer account allows scheduling on-demand courier pickups,
              real-time package tracking with automated agent assignment, and historical proof-of-delivery receipts.
            </p>
            <div class="customer-perks">
              <div class="perk-bullet"><strong>Security:</strong> JWT-encrypted session authentication.</div>
              <div class="perk-bullet"><strong>Permissions:</strong> Dedicated customer dispatch and package tracking access.</div>
            </div>
          </div>
        </div>
      }

      <!-- Admin Information (Shown for ADMIN role) -->
      @if (auth.role() === 'ADMIN') {
        <div class="card profile-card admin-info-card">
          <div class="card-header">
            <h2>Administrator Operations Badge</h2>
          </div>
          <div class="admin-info-content">
            <p>
              You hold central platform administrative privileges. You are authorized to manage
              delivery couriers, manually trigger assignment engine retries, modify system-wide service
              tariffs, and configure logistics depot locations.
            </p>
          </div>
        </div>
      }
    </div>

    <p class="edit-note">
      Role permissions and profile attributes are maintained authoritatively by the backend.
      Role elevation cannot be requested or performed through the browser client.
    </p>
  `,
  styles: [`
    .page-header {
      margin-bottom: var(--space-6);
    }

    .profile-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 480px));
      gap: var(--space-6);
      align-items: start;
    }

    .profile-card {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--color-border);
      margin-bottom: var(--space-2);
    }

    .card-header h2 {
      font-size: 16px;
      font-weight: 700;
      color: var(--color-text);
    }

    .role-pill {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: var(--color-primary-soft);
      color: var(--color-primary);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
    }

    .badge-accent {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: var(--color-secondary-soft);
      color: var(--color-secondary);
      padding: 3px 8px;
      border-radius: var(--radius-sm);
    }

    .profile-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: var(--space-2);
      border-bottom: 1px solid var(--color-border);
    }

    .profile-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .profile-label {
      color: var(--color-text-secondary);
      font-size: 13px;
    }

    .profile-value {
      font-weight: 600;
      font-size: 13.5px;
      color: var(--color-text);
    }

    .role-display {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .readonly-badge {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      background: var(--color-background);
      color: var(--color-muted);
      border: 1px solid var(--color-border);
      padding: 1px 6px;
      border-radius: 4px;
    }

    .font-mono {
      font-family: monospace;
      font-size: 13px;
    }

    .font-bold {
      font-weight: 700;
    }

    .rating-val {
      color: #b7791f;
    }

    .points-val {
      color: var(--color-success);
    }

    .customer-info-content, .admin-info-content {
      font-size: 13.5px;
      color: var(--color-text-secondary);
      line-height: 1.55;
    }

    .customer-perks {
      margin-top: var(--space-3);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .perk-bullet {
      font-size: 12.5px;
    }

    .perk-bullet strong {
      color: var(--color-text);
    }

    .empty-note {
      font-size: 13px;
      color: var(--color-muted);
    }

    .edit-note {
      margin-top: var(--space-6);
      color: var(--color-muted);
      font-size: 12px;
      max-width: 600px;
      line-height: 1.4;
    }
  `],
})
export class ProfileViewComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly agentService = inject(AgentService);

  readonly agent = signal<AgentView | null>(null);
  readonly loadingAgent = signal(false);

  ngOnInit(): void {
    if (this.auth.role() === 'AGENT') {
      this.loadingAgent.set(true);
      this.agentService.getMe().subscribe({
        next: (res) => {
          this.agent.set(res.data.agent);
          this.loadingAgent.set(false);
        },
        error: () => {
          this.loadingAgent.set(false);
        },
      });
    }
  }
}
