import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, forkJoin } from 'rxjs';

import { AgentService } from '../../../core/services/agent.service';
import { LocationService } from '../../../core/services/location.service';
import { DeliveryServiceCatalogService } from '../../../core/services/delivery-service.service';
import { UserService } from '../../../core/services/user.service';
import { AgentView, CreateAgentPayload } from '../../../core/models/agent.model';
import { LocationView } from '../../../core/models/location.model';
import { ServiceView } from '../../../core/models/service.model';
import { PublicUser } from '../../../core/models/user.model';
import { AGENT_STATUSES, VEHICLE_TYPES, AgentStatus, VehicleType } from '../../../core/models/enums.model';
import { ErrorResponse } from '../../../core/models/api-response.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { ToastService } from '../../../shared/components/toast.service';

@Component({
  selector: 'dh-admin-agent-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinnerComponent, StatusBadgeComponent],
  templateUrl: './agent-detail.component.html',
  styleUrl: './agent-detail.component.scss',
})
export class AdminAgentDetailComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly agentService = inject(AgentService);
  private readonly locationService = inject(LocationService);
  private readonly catalogService = inject(DeliveryServiceCatalogService);
  private readonly userService = inject(UserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly vehicleTypes = VEHICLE_TYPES;
  readonly statuses = AGENT_STATUSES;
  readonly isNew = signal(true);
  readonly agentId = signal<string | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly agent = signal<AgentView | null>(null);

  // Catalog metadata for relations
  readonly locations = signal<LocationView[]>([]);
  readonly services = signal<ServiceView[]>([]);
  readonly agentUsers = signal<PublicUser[]>([]);

  // Selected relationship IDs
  readonly servedLocationIds = signal<string[]>([]);
  readonly availableLocationIds = signal<string[]>([]);
  readonly offeredServiceIds = signal<string[]>([]);

  readonly form = this.fb.nonNullable.group({
    userId: ['', [Validators.required]],
    agentCode: ['', [Validators.required]],
    vehicleType: ['BIKE' as VehicleType, [Validators.required]],
    status: ['OFFLINE' as AgentStatus, [Validators.required]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const isNewAgent = !id || id === 'new';
    this.isNew.set(isNewAgent);

    if (!isNewAgent) {
      this.agentId.set(id);
    }

    this.loadMetadata(isNewAgent ? null : id);
  }

  private loadMetadata(agentId: string | null): void {
    this.loading.set(true);

    forkJoin({
      locations: this.locationService.list(),
      services: this.catalogService.list(),
      users: this.userService.list(),
    }).subscribe({
      next: ({ locations, services, users }) => {
        this.locations.set(locations.data.locations);
        this.services.set(services.data.services);
        this.agentUsers.set(users.data.users.filter((u) => u.role === 'AGENT'));

        if (agentId) {
          this.loadAgent(agentId);
        } else {
          this.loading.set(false);
        }
      },
      error: () => {
        this.loading.set(false);
        this.errorMessage.set('Could not load configuration metadata (locations/services).');
      },
    });
  }

  loadAgent(id: string): void {
    this.agentService
      .getById(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          const a = response.data.agent;
          this.agent.set(a);
          this.form.patchValue({
            userId: a.user.id,
            agentCode: a.agentCode,
            vehicleType: a.vehicleType,
            status: a.status,
          });
          this.servedLocationIds.set(a.servedLocationIds ?? []);
          this.availableLocationIds.set(a.availableLocationIds ?? []);
          this.offeredServiceIds.set(a.offeredServiceIds ?? []);
        },
        error: () => this.errorMessage.set('Could not load this agent.'),
      });
  }

  isServed(locationId: string): boolean {
    return this.servedLocationIds().includes(locationId);
  }

  isAvailable(locationId: string): boolean {
    return this.availableLocationIds().includes(locationId);
  }

  isOffered(serviceId: string): boolean {
    return this.offeredServiceIds().includes(serviceId);
  }

  toggleServedLocation(locationId: string): void {
    const current = this.servedLocationIds();
    this.servedLocationIds.set(
      current.includes(locationId)
        ? current.filter((id) => id !== locationId)
        : [...current, locationId],
    );
  }

  toggleAvailableLocation(locationId: string): void {
    const current = this.availableLocationIds();
    this.availableLocationIds.set(
      current.includes(locationId)
        ? current.filter((id) => id !== locationId)
        : [...current, locationId],
    );
  }

  toggleOfferedService(serviceId: string): void {
    const current = this.offeredServiceIds();
    this.offeredServiceIds.set(
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
  }

  selectAllServedLocations(): void {
    this.servedLocationIds.set(this.locations().map((l) => l.id));
  }

  clearAllServedLocations(): void {
    this.servedLocationIds.set([]);
  }

  selectAllAvailableLocations(): void {
    this.availableLocationIds.set(this.locations().map((l) => l.id));
  }

  clearAllAvailableLocations(): void {
    this.availableLocationIds.set([]);
  }

  selectAllOfferedServices(): void {
    this.offeredServiceIds.set(this.services().map((s) => s.id));
  }

  clearAllOfferedServices(): void {
    this.offeredServiceIds.set([]);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formVal = this.form.getRawValue();
    const payload: CreateAgentPayload = {
      userId: formVal.userId.trim(),
      agentCode: formVal.agentCode.trim(),
      vehicleType: formVal.vehicleType,
      status: formVal.status,
      servedLocationIds: this.servedLocationIds(),
      availableLocationIds: this.availableLocationIds(),
      offeredServiceIds: this.offeredServiceIds(),
    };

    this.errorMessage.set(null);
    this.saving.set(true);

    const request$ = this.isNew()
      ? this.agentService.create(payload)
      : this.agentService.update(this.agentId()!, payload);

    request$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.toast.show(this.isNew() ? 'Agent created successfully.' : 'Agent updated successfully.', 'success');
        this.router.navigate(['/admin/agents']);
      },
      error: (error: HttpErrorResponse) => {
        const body = error.error as ErrorResponse | undefined;
        this.errorMessage.set(body?.message ?? 'Could not save this agent.');
      },
    });
  }

  changeStatus(status: string): void {
    if (this.isNew() || !this.agentId()) return;
    this.agentService.updateStatus(this.agentId()!, status as any).subscribe({
      next: (response) => {
        this.agent.set(response.data.agent);
        this.form.patchValue({ status: response.data.agent.status });
        this.toast.show('Agent status updated.', 'success');
      },
      error: (error: HttpErrorResponse) => {
        const body = error.error as ErrorResponse | undefined;
        this.toast.show(body?.message ?? 'Could not update status.', 'error');
      },
    });
  }
}
