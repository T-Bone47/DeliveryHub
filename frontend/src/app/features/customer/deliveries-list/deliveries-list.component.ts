import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PackageService } from '../../../core/services/package.service';
import { PackageView } from '../../../core/models/package.model';
import { DeliveryStatus, DELIVERY_STATUSES } from '../../../core/models/enums.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state.component';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'dh-deliveries-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    PaginationComponent,
    IconComponent,
  ],
  templateUrl: './deliveries-list.component.html',
  styleUrl: './deliveries-list.component.scss',
})
export class DeliveriesListComponent implements OnInit {
  private readonly packageService = inject(PackageService);

  readonly statuses = DELIVERY_STATUSES;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly packages = signal<PackageView[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  readonly statusFilter = signal<DeliveryStatus | ''>('');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.packageService
      .listMine({
        page: this.page(),
        limit: 10,
        status: this.statusFilter() || undefined,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.packages.set(response.data.packages);
          this.totalPages.set(response.data.pagination.totalPages || 1);
          this.total.set(response.data.pagination.total);
        },
        error: () => this.error.set('Could not load your deliveries.'),
      });
  }

  onStatusChange(value: string): void {
    this.statusFilter.set(value as DeliveryStatus | '');
    this.page.set(1);
    this.load();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.load();
  }
}
