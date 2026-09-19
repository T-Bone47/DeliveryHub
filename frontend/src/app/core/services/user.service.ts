import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { SuccessResponse } from '../models/api-response.model';
import { PublicUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<SuccessResponse<{ users: PublicUser[] }>> {
    return this.http.get<SuccessResponse<{ users: PublicUser[] }>>(`${this.baseUrl}/users`);
  }

  getById(id: string): Observable<SuccessResponse<{ user: PublicUser }>> {
    return this.http.get<SuccessResponse<{ user: PublicUser }>>(`${this.baseUrl}/users/${id}`);
  }

  update(id: string, body: Partial<PublicUser>): Observable<SuccessResponse<{ user: PublicUser }>> {
    return this.http.put<SuccessResponse<{ user: PublicUser }>>(`${this.baseUrl}/users/${id}`, body);
  }
}
