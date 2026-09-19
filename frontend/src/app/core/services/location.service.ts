import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { SuccessResponse } from '../models/api-response.model';
import { CreateLocationPayload, LocationView } from '../models/location.model';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<SuccessResponse<{ locations: LocationView[] }>> {
    return this.http.get<SuccessResponse<{ locations: LocationView[] }>>(`${this.baseUrl}/locations`);
  }

  create(payload: CreateLocationPayload): Observable<SuccessResponse<{ location: LocationView }>> {
    return this.http.post<SuccessResponse<{ location: LocationView }>>(`${this.baseUrl}/locations`, payload);
  }

  update(id: string, payload: Partial<CreateLocationPayload>): Observable<SuccessResponse<{ location: LocationView }>> {
    return this.http.put<SuccessResponse<{ location: LocationView }>>(`${this.baseUrl}/locations/${id}`, payload);
  }
}
