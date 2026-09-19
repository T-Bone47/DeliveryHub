import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { LocationService } from '../../../core/services/location.service';
import { LocationView } from '../../../core/models/location.model';
import { ErrorResponse } from '../../../core/models/api-response.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state.component';
import { ErrorStateComponent } from '../../../shared/components/error-state.component';
import { ToastService } from '../../../shared/components/toast.service';

@Component({
  selector: 'dh-admin-locations',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    ErrorStateComponent,
  ],
  templateUrl: './locations.component.html',
  styleUrl: './locations.component.scss',
})
export class AdminLocationsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly locationService = inject(LocationService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly locations = signal<LocationView[]>([]);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    postalCode: ['', [Validators.required]],
    latitude: [0, [Validators.required]],
    longitude: [0, [Validators.required]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.locationService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.locations.set(response.data.locations),
        error: () => this.error.set('Could not load locations.'),
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.formError.set(null);
    this.saving.set(true);
    const value = this.form.getRawValue();
    this.locationService
      .create({ ...value, latitude: Number(value.latitude), longitude: Number(value.longitude) })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Location created.', 'success');
          this.form.reset({ name: '', city: '', state: '', postalCode: '', latitude: 0, longitude: 0 });
          this.showForm.set(false);
          this.load();
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error as ErrorResponse | undefined;
          this.formError.set(body?.message ?? 'Could not create location.');
        },
      });
  }

  toggleActive(location: LocationView): void {
    this.locationService.update(location.id, { isActive: !location.isActive }).subscribe({
      next: () => {
        this.toast.show(`Location ${location.isActive ? 'deactivated' : 'activated'}.`, 'success');
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        const body = error.error as ErrorResponse | undefined;
        this.toast.show(body?.message ?? 'Could not update location.', 'error');
      },
    });
  }
}
