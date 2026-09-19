import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PackageService } from '../../../core/services/package.service';
import { PackageView } from '../../../core/models/package.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state.component';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'dh-agent-deliveries',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    IconComponent,
  ],
  template: `
    <div class="page-header">
      <div>
        <div class="header-pretitle">
          <span class="partner-badge">COURIER FLEET ASSIGNMENT</span>
        </div>
        <h1>Assigned Manifests</h1>
        <p class="subtitle">Complete dispatch queue assigned to your active courier shift.</p>
      </div>
      <div class="header-actions">
        <button type="button" class="btn btn-secondary btn-sm" (click)="load()" [disabled]="loading()">
          <dh-icon name="refresh"></dh-icon>
          <span>Refresh Queue</span>
        </button>
      </div>
    </div>

    @if (loading()) {
      <dh-loading-spinner label="Loading your assigned manifests…"></dh-loading-spinner>
    } @else if (error()) {
      <dh-error-state [message]="error()!" (retry)="load()"></dh-error-state>
    } @else if (packages().length === 0) {
      <dh-empty-state
        title="No assigned deliveries"
        description="You currently have no packages assigned to your queue. New assignments will appear here automatically."
      ></dh-empty-state>
    } @else {
      <div class="card table-card desktop-only">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tracking #</th>
              <th>Type</th>
              <th>Description</th>
              <th>Weight</th>
              <th>Route Corridor</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            @for (pkg of packages(); track pkg.id) {
              <tr>
                <td class="tracking-cell">
                  <a [routerLink]="['/agent/deliveries', pkg.id]" class="tracking-link font-mono">
                    {{ pkg.trackingNumber }}
                  </a>
                </td>
                <td>
                  <span class="type-badge">{{ pkg.packageType }}</span>
                </td>
                <td class="desc-cell">{{ pkg.description }}</td>
                <td><strong class="font-mono">{{ pkg.weight }} kg</strong></td>
                <td class="route-cell">
                  <span class="city-from">{{ pkg.sourceLocation.city }}</span>
                  <span class="arrow">&rarr;</span>
                  <span class="city-to">{{ pkg.destinationLocation.city }}</span>
                </td>
                <td>
                  <dh-status-badge [status]="pkg.status"></dh-status-badge>
                </td>
                <td>
                  <a [routerLink]="['/agent/deliveries', pkg.id]" class="btn btn-primary btn-sm view-btn">
                    <span>Open Console &rarr;</span>
                  </a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Mobile Operational Cards (<768px) -->
      <div class="mobile-only mobile-delivery-cards">
        @for (pkg of packages(); track pkg.id) {
          <div class="card mobile-agent-card">
            <div class="m-card-top">
              <span class="tracking-code font-mono">{{ pkg.trackingNumber }}</span>
              <dh-status-badge [status]="pkg.status"></dh-status-badge>
            </div>
            <div class="m-route-row">
              <span class="city">{{ pkg.sourceLocation.city }}</span>
              <span class="arrow">&rarr;</span>
              <span class="city dest">{{ pkg.destinationLocation.city }}</span>
            </div>
            <div class="m-meta-row">
              <span>{{ pkg.packageType }} &bull; {{ pkg.weight }} kg</span>
              <span>{{ pkg.scheduledDate | date: 'MMM d, h:mm a' }}</span>
            </div>
            <a [routerLink]="['/agent/deliveries', pkg.id]" class="btn btn-primary btn-sm m-action-btn">
              Open Delivery Console &rarr;
            </a>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-6);
      flex-wrap: wrap;
      gap: var(--space-4);

      .header-pretitle {
        margin-bottom: var(--space-1);
      }

      .partner-badge {
        font-size: 10.5px;
        font-weight: 800;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        color: var(--color-primary);
        background: var(--color-primary-light);
        padding: 3px 10px;
        border-radius: var(--radius-full);
      }

      h1 {
        font-size: 28px;
        font-weight: 800;
        font-family: var(--font-display);
        color: var(--color-text);
        letter-spacing: -0.5px;
      }

      .subtitle {
        font-size: 14px;
        color: var(--color-text-secondary);
      }
    }

    .table-card {
      padding: 0;
      overflow-x: auto;
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13.5px;
    }

    .data-table th {
      background: var(--color-background);
      padding: var(--space-4) var(--space-4);
      font-weight: 700;
      color: var(--color-text-secondary);
      border-bottom: 1px solid var(--color-border);
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .data-table td {
      padding: var(--space-4);
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text);
      vertical-align: middle;
    }

    .data-table tr:last-child td {
      border-bottom: none;
    }

    .data-table tr:hover td {
      background: #fffbf8;
    }

    .tracking-link {
      font-weight: 800;
      color: var(--color-text);
      text-decoration: none;

      &:hover {
        color: var(--color-primary);
      }
    }

    .type-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: var(--color-background);
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
    }

    .desc-cell {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: var(--color-text-secondary);
    }

    .route-cell {
      white-space: nowrap;
      font-weight: 700;

      .city-from { color: var(--color-text); }
      .arrow { color: var(--color-primary); margin: 0 4px; }
      .city-to { color: var(--color-primary); }
    }

    .view-btn {
      white-space: nowrap;
      border-radius: var(--radius-full);
      font-weight: 700;
    }

    .desktop-only { display: block; }
    .mobile-only { display: none; }

    .mobile-delivery-cards {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .mobile-agent-card {
      padding: var(--space-5);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      border-radius: var(--radius-xl);
      border: 1px solid var(--color-border);
      box-shadow: var(--shadow-sm);
      background: var(--color-surface);
    }

    .m-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: var(--space-3);
    }

    .m-route-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: 15px;
      font-weight: 800;
      font-family: var(--font-display);

      .dest { color: var(--color-primary); }
      .arrow { color: var(--color-primary); }
    }

    .m-meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 12.5px;
      color: var(--color-text-secondary);
    }

    .m-action-btn {
      width: 100%;
      padding: 10px;
      font-size: 13.5px;
      border-radius: var(--radius-full);
      justify-content: center;
    }

    @media (max-width: 768px) {
      .desktop-only { display: none; }
      .mobile-only { display: flex; }
    }
  `],
})
export class AgentDeliveriesComponent implements OnInit {
  private readonly packageService = inject(PackageService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly packages = signal<PackageView[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.packageService
      .listAssigned({ limit: 100 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.packages.set(response.data.packages),
        error: () => this.error.set('Could not load your assigned delivery queue.'),
      });
  }
}
