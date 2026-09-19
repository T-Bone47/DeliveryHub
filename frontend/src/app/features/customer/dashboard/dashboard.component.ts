import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PackageService } from '../../../core/services/package.service';
import { AuthService } from '../../../core/services/auth.service';
import { PackageView } from '../../../core/models/package.model';
import { StatCardComponent } from '../../../shared/components/stat-card.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state.component';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'dh-customer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatCardComponent,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    IconComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class CustomerDashboardComponent implements OnInit {
  private readonly packageService = inject(PackageService);
  readonly auth = inject(AuthService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly allPackages = signal<PackageView[]>([]);
  readonly recentPackages = signal<PackageView[]>([]);

  readonly activeCount = signal(0);
  readonly deliveredCount = signal(0);
  readonly pendingCount = signal(0);

  // Spotlight the primary active package in transit or pending handover
  readonly activeDelivery = computed<PackageView | null>(() => {
    const list = this.allPackages();
    return (
      list.find((p) => p.status === 'OUT_FOR_DELIVERY') ||
      list.find((p) => p.status === 'IN_TRANSIT') ||
      list.find((p) => p.status === 'PICKED_UP') ||
      list.find((p) => p.status === 'AGENT_ASSIGNED') ||
      list.find((p) => p.status === 'PENDING') ||
      null
    );
  });

  readonly greetingTime = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.packageService
      .listMine({ limit: 100 })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          const items = response.data.packages;
          this.allPackages.set(items);
          this.recentPackages.set(items.slice(0, 5));
          this.activeCount.set(
            items.filter((p) => !['DELIVERED', 'CANCELLED', 'FAILED'].includes(p.status)).length,
          );
          this.deliveredCount.set(items.filter((p) => p.status === 'DELIVERED').length);
          this.pendingCount.set(items.filter((p) => p.status === 'PENDING').length);
        },
        error: () => this.error.set('Could not load your deliveries.'),
      });
  }
}
