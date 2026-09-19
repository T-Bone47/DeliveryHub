import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { SuccessResponse } from '../models/api-response.model';
import { CreateServicePayload, ServiceView } from '../models/service.model';

/** Wraps /api/services — the catalog of delivery service tiers (not Angular DI services). */
@Injectable({ providedIn: 'root' })
export class DeliveryServiceCatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<SuccessResponse<{ services: ServiceView[] }>> {
    return this.http.get<SuccessResponse<{ services: ServiceView[] }>>(`${this.baseUrl}/services`);
  }

  create(payload: CreateServicePayload): Observable<SuccessResponse<{ service: ServiceView }>> {
    return this.http.post<SuccessResponse<{ service: ServiceView }>>(`${this.baseUrl}/services`, payload);
  }

  update(id: string, payload: Partial<CreateServicePayload>): Observable<SuccessResponse<{ service: ServiceView }>> {
    return this.http.put<SuccessResponse<{ service: ServiceView }>>(`${this.baseUrl}/services/${id}`, payload);
  }

  updateStatus(id: string, isActive: boolean): Observable<SuccessResponse<{ service: ServiceView }>> {
    return this.http.put<SuccessResponse<{ service: ServiceView }>>(`${this.baseUrl}/services/${id}/status`, {
      isActive,
    });
  }
}
