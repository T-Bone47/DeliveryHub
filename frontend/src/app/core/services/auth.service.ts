import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { SuccessResponse } from '../models/api-response.model';
import { AuthResult, LoginPayload, PublicUser, RegisterPayload } from '../models/user.model';

const TOKEN_KEY = 'deliveryhub.token';
const USER_KEY = 'deliveryhub.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly currentUserSignal = signal<PublicUser | null>(this.readStoredUser());

  readonly currentUser = computed(() => this.currentUserSignal());
  readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  readonly role = computed(() => this.currentUserSignal()?.role ?? null);

  login(payload: LoginPayload): Observable<SuccessResponse<AuthResult>> {
    return this.http
      .post<SuccessResponse<AuthResult>>(`${this.baseUrl}/auth/login`, payload)
      .pipe(tap((response) => this.persistSession(response.data)));
  }

  register(payload: RegisterPayload): Observable<SuccessResponse<{ user: PublicUser }>> {
    return this.http.post<SuccessResponse<{ user: PublicUser }>>(`${this.baseUrl}/auth/register`, payload);
  }

  fetchCurrentUser(): Observable<SuccessResponse<{ user: PublicUser }>> {
    return this.http
      .get<SuccessResponse<{ user: PublicUser }>>(`${this.baseUrl}/auth/me`)
      .pipe(
        tap((response) => {
          this.currentUserSignal.set(response.data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
        }),
      );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSignal.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private persistSession(result: AuthResult): void {
    localStorage.setItem(TOKEN_KEY, result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    this.currentUserSignal.set(result.user);
  }

  private readStoredUser(): PublicUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PublicUser;
    } catch {
      return null;
    }
  }

  redirectPathForRole(): string {
    switch (this.role()) {
      case 'CUSTOMER':
        return '/customer/dashboard';
      case 'AGENT':
        return '/agent/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
      default:
        return '/login';
    }
  }
}
