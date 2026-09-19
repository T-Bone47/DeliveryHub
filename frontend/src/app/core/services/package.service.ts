import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { SuccessResponse } from '../models/api-response.model';
import {
  AssignmentRetryResult,
  AssignmentView,
  CreatePackagePayload,
  CreatePackageResult,
  GenerateOtpResponseData,
  PackageDetailsView,
  PackageListQuery,
  PackageListView,
  ProofOfDeliveryView,
} from '../models/package.model';

@Injectable({ providedIn: 'root' })
export class PackageService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Customer-only: creates a delivery request. Backend auto-attempts agent assignment. */
  create(payload: CreatePackagePayload): Observable<SuccessResponse<CreatePackageResult>> {
    return this.http.post<SuccessResponse<CreatePackageResult>>(`${this.baseUrl}/packages`, payload);
  }

  /** Customer-only: the authenticated customer's own delivery requests. */
  listMine(query: PackageListQuery = {}): Observable<SuccessResponse<PackageListView>> {
    return this.http.get<SuccessResponse<PackageListView>>(`${this.baseUrl}/packages/my`, {
      params: this.toParams(query),
    });
  }

  /** Agent-only: packages assigned to the authenticated agent's profile. */
  listAssigned(query: PackageListQuery = {}): Observable<SuccessResponse<PackageListView>> {
    return this.http.get<SuccessResponse<PackageListView>>(`${this.baseUrl}/packages/assigned`, {
      params: this.toParams(query),
    });
  }

  /** Admin-only: every delivery request in the system, with filters. */
  listAll(query: PackageListQuery = {}): Observable<SuccessResponse<PackageListView>> {
    return this.http.get<SuccessResponse<PackageListView>>(`${this.baseUrl}/packages`, {
      params: this.toParams(query),
    });
  }

  /** Available to ADMIN, the owning CUSTOMER, or the assigned AGENT. */
  getById(id: string): Observable<SuccessResponse<PackageDetailsView>> {
    return this.http.get<SuccessResponse<PackageDetailsView>>(`${this.baseUrl}/packages/${id}`);
  }

  getAssignment(id: string): Observable<SuccessResponse<AssignmentView>> {
    return this.http.get<SuccessResponse<AssignmentView>>(`${this.baseUrl}/packages/${id}/assignment`);
  }

  /** Admin-only: retries automatic agent assignment for a still-PENDING package. */
  retryAssignment(id: string): Observable<SuccessResponse<AssignmentRetryResult>> {
    return this.http.post<SuccessResponse<AssignmentRetryResult>>(`${this.baseUrl}/packages/${id}/assign`, {});
  }

  /** Customer-only: generate 6-digit OTP for pickup or final delivery */
  generateOtp(id: string, purpose: 'PICKUP' | 'DELIVERY'): Observable<SuccessResponse<GenerateOtpResponseData>> {
    return this.http.post<SuccessResponse<GenerateOtpResponseData>>(`${this.baseUrl}/packages/${id}/otp`, { purpose });
  }

  /** Agent-only: physically verify OTP provided by customer */
  verifyOtp(id: string, purpose: 'PICKUP' | 'DELIVERY', otp: string): Observable<SuccessResponse<PackageDetailsView>> {
    return this.http.post<SuccessResponse<PackageDetailsView>>(`${this.baseUrl}/packages/${id}/otp/verify`, { purpose, otp });
  }

  /** Agent-only: advance delivery tracking state (IN_TRANSIT, OUT_FOR_DELIVERY) */
  updateTrackingStatus(id: string, status: string): Observable<SuccessResponse<PackageDetailsView>> {
    return this.http.patch<SuccessResponse<PackageDetailsView>>(`${this.baseUrl}/packages/${id}/status`, { status });
  }

  /** Agent-only: upload proof of delivery photo */
  uploadProof(id: string, photoData: string): Observable<SuccessResponse<PackageDetailsView>> {
    return this.http.post<SuccessResponse<PackageDetailsView>>(`${this.baseUrl}/packages/${id}/proof`, { photoData });
  }

  /** Customer, Agent, Admin: get proof of delivery details */
  getProof(id: string): Observable<SuccessResponse<ProofOfDeliveryView>> {
    return this.http.get<SuccessResponse<ProofOfDeliveryView>>(`${this.baseUrl}/packages/${id}/proof`);
  }

  /** Agent-only: report a delivery exception */
  reportException(id: string, reason: string, note?: string): Observable<SuccessResponse<PackageDetailsView>> {
    return this.http.post<SuccessResponse<PackageDetailsView>>(`${this.baseUrl}/packages/${id}/exception`, { reason, note });
  }

  /** Customer or Admin: reschedule failed or unfulfilled delivery */
  rescheduleDelivery(id: string, rescheduledDate: string): Observable<SuccessResponse<PackageDetailsView>> {
    return this.http.post<SuccessResponse<PackageDetailsView>>(`${this.baseUrl}/packages/${id}/reschedule`, { rescheduledDate });
  }

  private toParams(query: PackageListQuery): HttpParams {
    let params = new HttpParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return params;
  }
}
