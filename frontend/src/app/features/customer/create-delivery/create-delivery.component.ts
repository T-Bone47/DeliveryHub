import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { PackageService } from '../../../core/services/package.service';
import { DeliveryServiceCatalogService } from '../../../core/services/delivery-service.service';
import { ServiceView } from '../../../core/models/service.model';
import { ErrorResponse } from '../../../core/models/api-response.model';
import { PACKAGE_TYPES } from '../../../core/models/enums.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner.component';
import { ToastService } from '../../../shared/components/toast.service';
import { IconComponent } from '../../../shared/components/icon.component';

/** Built-in geocode lookup for common Indian cities.
 *  Coordinates are city-centre approximations (WGS-84).
 *  Users never see or type these — they are resolved automatically from the
 *  city + state text the user enters.
 */
const CITY_COORDS: Record<string, { latitude: number; longitude: number; state: string }> = {
  'hyderabad':      { latitude: 17.3850, longitude: 78.4867, state: 'Telangana' },
  'secunderabad':   { latitude: 17.4399, longitude: 78.4983, state: 'Telangana' },
  'warangal':       { latitude: 17.9784, longitude: 79.5941, state: 'Telangana' },
  'nizamabad':      { latitude: 18.6725, longitude: 78.0941, state: 'Telangana' },
  'karimnagar':     { latitude: 18.4386, longitude: 79.1288, state: 'Telangana' },
  'ashok nagar':    { latitude: 17.4127, longitude: 78.4730, state: 'Telangana' },
  'khammam':        { latitude: 17.2473, longitude: 80.1514, state: 'Telangana' },
  'vijayawada':     { latitude: 16.5062, longitude: 80.6480, state: 'Andhra Pradesh' },
  'visakhapatnam':  { latitude: 17.6868, longitude: 83.2185, state: 'Andhra Pradesh' },
  'guntur':         { latitude: 16.3067, longitude: 80.4365, state: 'Andhra Pradesh' },
  'nellore':        { latitude: 14.4426, longitude: 79.9865, state: 'Andhra Pradesh' },
  'kurnool':        { latitude: 15.8281, longitude: 78.0373, state: 'Andhra Pradesh' },
  'tirupati':       { latitude: 13.6288, longitude: 79.4192, state: 'Andhra Pradesh' },
  'tadipatri':      { latitude: 14.9047, longitude: 78.0090, state: 'Andhra Pradesh' },
  'rajahmundry':    { latitude: 17.0005, longitude: 81.8040, state: 'Andhra Pradesh' },
  'kakinada':       { latitude: 16.9891, longitude: 82.2475, state: 'Andhra Pradesh' },
  'anantapur':      { latitude: 14.6819, longitude: 77.6006, state: 'Andhra Pradesh' },
  'kadapa':         { latitude: 14.4673, longitude: 78.8242, state: 'Andhra Pradesh' },
  'krishnapuram':   { latitude: 14.9047, longitude: 78.0090, state: 'Andhra Pradesh' },
  'mumbai':         { latitude: 19.0760, longitude: 72.8777, state: 'Maharashtra' },
  'pune':           { latitude: 18.5204, longitude: 73.8567, state: 'Maharashtra' },
  'nagpur':         { latitude: 21.1458, longitude: 79.0882, state: 'Maharashtra' },
  'delhi':          { latitude: 28.7041, longitude: 77.1025, state: 'Delhi' },
  'new delhi':      { latitude: 28.6139, longitude: 77.2090, state: 'Delhi' },
  'bengaluru':      { latitude: 12.9716, longitude: 77.5946, state: 'Karnataka' },
  'bangalore':      { latitude: 12.9716, longitude: 77.5946, state: 'Karnataka' },
  'mysuru':         { latitude: 12.2958, longitude: 76.6394, state: 'Karnataka' },
  'chennai':        { latitude: 13.0827, longitude: 80.2707, state: 'Tamil Nadu' },
  'coimbatore':     { latitude: 11.0168, longitude: 76.9558, state: 'Tamil Nadu' },
  'madurai':        { latitude:  9.9252, longitude: 78.1198, state: 'Tamil Nadu' },
  'kolkata':        { latitude: 22.5726, longitude: 88.3639, state: 'West Bengal' },
  'ahmedabad':      { latitude: 23.0225, longitude: 72.5714, state: 'Gujarat' },
  'surat':          { latitude: 21.1702, longitude: 72.8311, state: 'Gujarat' },
  'jaipur':         { latitude: 26.9124, longitude: 75.7873, state: 'Rajasthan' },
  'lucknow':        { latitude: 26.8467, longitude: 80.9462, state: 'Uttar Pradesh' },
  'kanpur':         { latitude: 26.4499, longitude: 80.3319, state: 'Uttar Pradesh' },
  'bhopal':         { latitude: 23.2599, longitude: 77.4126, state: 'Madhya Pradesh' },
  'indore':         { latitude: 22.7196, longitude: 75.8577, state: 'Madhya Pradesh' },
  'patna':          { latitude: 25.5941, longitude: 85.1376, state: 'Bihar' },
  'bhubaneswar':    { latitude: 20.2961, longitude: 85.8245, state: 'Odisha' },
  'guwahati':       { latitude: 26.1445, longitude: 91.7362, state: 'Assam' },
  'chandigarh':     { latitude: 30.7333, longitude: 76.7794, state: 'Chandigarh' },
};

function geocodeCity(city: string): { latitude: number; longitude: number } | null {
  const key = city.trim().toLowerCase();
  const found = CITY_COORDS[key];
  if (found) return { latitude: found.latitude, longitude: found.longitude };
  // Fuzzy: check if any key is a substring
  for (const [k, v] of Object.entries(CITY_COORDS)) {
    if (key.includes(k) || k.includes(key)) return { latitude: v.latitude, longitude: v.longitude };
  }
  return null;
}

function normaliseState(city: string, enteredState: string): string {
  const key = city.trim().toLowerCase();
  const found = CITY_COORDS[key];
  if (found) return found.state; // Use canonical state spelling
  return enteredState.trim();
}

@Component({
  selector: 'dh-create-delivery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LoadingSpinnerComponent, IconComponent],
  templateUrl: './create-delivery.component.html',
  styleUrl: './create-delivery.component.scss',
})
export class CreateDeliveryComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly packageService = inject(PackageService);
  private readonly catalog = inject(DeliveryServiceCatalogService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly packageTypes = PACKAGE_TYPES;
  readonly services = signal<ServiceView[]>([]);
  readonly loadingServices = signal(true);
  readonly servicesError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    packageType: ['PARCEL', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(3)]],
    weight: [1, [Validators.required, Validators.min(0.01)]],
    serviceId: ['', [Validators.required]],
    scheduledDate: ['', [Validators.required]],
    sourceAddress: ['', [Validators.required]],
    sourceCity: ['', [Validators.required]],
    sourceState: ['', [Validators.required]],
    sourcePostalCode: ['', [Validators.required]],
    destinationAddress: ['', [Validators.required]],
    destinationCity: ['', [Validators.required]],
    destinationState: ['', [Validators.required]],
    destinationPostalCode: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.loadingServices.set(true);
    this.servicesError.set(null);
    this.catalog
      .list()
      .pipe(finalize(() => this.loadingServices.set(false)))
      .subscribe({
        next: (response) => this.services.set(response.data.services.filter((s) => s.isActive)),
        error: () => this.servicesError.set('Could not load available services.'),
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Complete all required delivery, service, and location fields before creating the delivery.');
      return;
    }

    const value = this.form.getRawValue();

    // Auto-geocode: derive coordinates from city names
    const srcCoords = geocodeCity(value.sourceCity);
    const dstCoords = geocodeCity(value.destinationCity);

    if (!srcCoords) {
      this.errorMessage.set(
        `Could not determine coordinates for pickup city "${value.sourceCity}". ` +
        `Please check the city name spelling (e.g. "Hyderabad", "Vijayawada").`
      );
      return;
    }
    if (!dstCoords) {
      this.errorMessage.set(
        `Could not determine coordinates for destination city "${value.destinationCity}". ` +
        `Please check the city name spelling (e.g. "Hyderabad", "Vijayawada").`
      );
      return;
    }

    // Normalise state spelling from city lookup (fixes "Andhra Pradhesh" → "Andhra Pradesh")
    const srcState = normaliseState(value.sourceCity, value.sourceState);
    const dstState = normaliseState(value.destinationCity, value.destinationState);

    this.errorMessage.set(null);
    this.submitting.set(true);

    this.packageService
      .create({
        packageType: value.packageType as any,
        description: value.description,
        weight: Number(value.weight),
        serviceId: value.serviceId,
        scheduledDate: new Date(value.scheduledDate).toISOString(),
        sourceLocation: {
          address: value.sourceAddress,
          city: value.sourceCity,
          state: srcState,
          postalCode: value.sourcePostalCode,
          latitude: srcCoords.latitude,
          longitude: srcCoords.longitude,
        },
        destinationLocation: {
          address: value.destinationAddress,
          city: value.destinationCity,
          state: dstState,
          postalCode: value.destinationPostalCode,
          latitude: dstCoords.latitude,
          longitude: dstCoords.longitude,
        },
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (response) => {
          const agentAssigned = !!response.data.assignment?.agentId;
          this.toast.show(
            agentAssigned
              ? `Delivery created and an agent was assigned. Tracking #${response.data.package.trackingNumber}`
              : `Delivery created. Tracking #${response.data.package.trackingNumber} — no agent is available yet.`,
            agentAssigned ? 'success' : 'info',
          );
          this.router.navigate(['/customer/deliveries', response.data.package.id]);
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error as ErrorResponse | undefined;
          this.errorMessage.set(body?.message ?? 'Could not create the delivery request.');
        },
      });
  }
}
