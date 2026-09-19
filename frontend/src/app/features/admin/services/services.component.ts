import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { DeliveryServiceCatalogService } from '../../../core/services/delivery-service.service';
import { ServiceView } from '../../../core/models/service.model';
import { ErrorResponse } from '../../../core/models/api-response.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state.component';
import { ToastService } from '../../../shared/components/toast.service';

@Component({
  selector: 'dh-admin-services',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './services.component.html',
  styleUrl: './services.component.scss',
})
export class AdminServicesComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly catalog = inject(DeliveryServiceCatalogService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly services = signal<ServiceView[]>([]);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    serviceCode: ['', [Validators.required]],
    name: ['', [Validators.required]],
    description: ['', [Validators.required]],
    basePrice: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.catalog
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.services.set(response.data.services),
        error: () => this.error.set('Could not load services.'),
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.formError.set(null);
    this.saving.set(true);
    this.catalog
      .create(this.form.getRawValue())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Service created.', 'success');
          this.form.reset({ serviceCode: '', name: '', description: '', basePrice: 0 });
          this.showForm.set(false);
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error as ErrorResponse | undefined;
          this.formError.set(body?.message ?? 'Could not create service.');
        },
      });
  }

  toggleActive(service: ServiceView): void {
    this.catalog.updateStatus(service.id, !service.isActive).subscribe({
      next: () => {
        this.toast.show(`Service ${service.isActive ? 'deactivated' : 'activated'}.`, 'success');
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        const body = error.error as ErrorResponse | undefined;
        this.toast.show(body?.message ?? 'Could not update service.', 'error');
      },
    });
  }
}
