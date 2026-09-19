import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, retry } from 'rxjs';

import { PackageService } from '../../../core/services/package.service';
import { PackageView } from '../../../core/models/package.model';
import { DeliveryStatus, DELIVERY_STATUSES } from '../../../core/models/enums.model';
import { ErrorResponse } from '../../../core/models/api-response.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state.component';
import { PaginationComponent } from '../../../shared/components/pagination.component';
import { ToastService } from '../../../shared/components/toast.service';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'dh-admin-packages',
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
  templateUrl: './packages.component.html',
  styleUrl: './packages.component.scss',
})
export class AdminPackagesComponent implements OnInit {
  private readonly packageService = inject(PackageService);
  private readonly toast = inject(ToastService);

  readonly statuses = DELIVERY_STATUSES;
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly packages = signal<PackageView[]>([]);
  readonly page = signal(1);
  readonly totalPages = signal(1);
  readonly total = signal(0);
  readonly statusFilter = signal<DeliveryStatus | ''>('');
  readonly assigningId = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.packageService
      .listAll({ page: this.page(), limit: 15, status: this.statusFilter() || undefined })
      .pipe(
        retry({ count: 2, delay: 500 }),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (response) => {
          this.packages.set(response.data?.packages ?? []);
          this.totalPages.set(response.data?.pagination?.totalPages || 1);
          this.total.set(response.data?.pagination?.total ?? 0);
        },
        error: () => this.error.set('Could not load packages.'),
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

  retryAssignment(pkg: PackageView): void {
    this.assigningId.set(pkg.id);
    this.packageService
      .retryAssignment(pkg.id)
      .pipe(finalize(() => this.assigningId.set(null)))
      .subscribe({
        next: (response) => {
          const message = response.data.agentId
            ? `Assigned to ${response.data.agentName}.`
            : response.data.reason || 'No eligible agent found.';
          this.toast.show(message, response.data.agentId ? 'success' : 'info');
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error as ErrorResponse | undefined;
          this.toast.show(body?.message ?? 'Could not retry assignment.', 'error');
        },
      });
  }
}
