import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { ErrorResponse } from '../../../core/models/api-response.model';
import { AuthLayoutComponent } from '../shared/auth-layout.component';
import { IconComponent } from '../../../shared/components/icon.component';

@Component({
  selector: 'dh-customer-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthLayoutComponent, IconComponent],
  template: `
    <dh-auth-layout
      headline="Customer Shipment Portal"
      subheadline="Book pickups, monitor parcels in transit, and view verified delivery receipts."
    >
      <div class="auth-header">
        <div class="role-badge">Customer Portal</div>
        <h2 class="auth-title">Welcome back</h2>
        <p class="auth-subtitle">Enter your customer account credentials to sign in.</p>
      </div>

      <!-- Session Expired Notification -->
      @if (sessionExpired()) {
        <div class="alert alert-warning" role="alert">
          Your session has expired. Please sign in again.
        </div>
      }

      <!-- Wrong Portal Notice -->
      @if (wrongPortalRole(); as role) {
        <div class="alert alert-info wrong-portal-box" role="alert">
          <div class="alert-content">
            <strong>Incorrect Portal</strong>
            <p>This account is registered as an {{ role === 'AGENT' ? 'Agent' : 'Administrator' }}.</p>
          </div>
          <button
            type="button"
            class="btn btn-primary btn-sm redirect-btn"
            (click)="continueToCorrectPortal(role)"
          >
            Continue to {{ role === 'AGENT' ? 'Agent' : 'Admin' }} Portal
          </button>
        </div>
      }

      <!-- General Error Message -->
      @if (errorMessage()) {
        <div class="alert alert-error" role="alert">{{ errorMessage() }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="customer-email">Email address</label>
          <input
            id="customer-email"
            type="email"
            formControlName="email"
            autocomplete="email"
            placeholder="name@example.com"
            [class.invalid]="form.controls.email.invalid && form.controls.email.touched"
          />
          @if (form.controls.email.invalid && form.controls.email.touched) {
            <span class="error-text">Enter a valid email address.</span>
          }
        </div>

        <div class="field">
          <div class="field-label-row">
            <label for="customer-password">Password</label>
          </div>
          <div class="password-wrapper">
            <input
              id="customer-password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="current-password"
              placeholder="Enter your password"
              [class.invalid]="form.controls.password.invalid && form.controls.password.touched"
            />
            <button
              type="button"
              class="password-toggle"
              (click)="togglePasswordVisibility()"
              [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
            >
              <dh-icon [name]="showPassword() ? 'eye-off' : 'eye'"></dh-icon>
            </button>
          </div>
          @if (form.controls.password.invalid && form.controls.password.touched) {
            <span class="error-text">Password is required.</span>
          }
        </div>

        <button
          type="submit"
          class="btn btn-primary submit-btn"
          [disabled]="submitting()"
        >
          @if (submitting()) {
            <span class="btn-spinner"></span>
            <span>Signing in…</span>
          } @else {
            <span>Sign In to Customer Portal</span>
          }
        </button>
      </form>

      <div class="auth-footer">
        <p>Don't have an account? <a routerLink="/customer/register">Create Customer Account</a></p>
        <p class="switch-portal-link">
          <a routerLink="/login">← Switch access portal</a>
        </p>
      </div>
    </dh-auth-layout>
  `,
  styles: [`
    .auth-header {
      margin-bottom: var(--space-6);
    }

    .role-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: var(--color-primary-soft);
      color: var(--color-primary);
      padding: 3px 10px;
      border-radius: var(--radius-sm);
      margin-bottom: var(--space-2);
    }

    .auth-title {
      font-size: 24px;
      font-weight: 700;
      color: var(--color-text);
      margin-bottom: var(--space-1);
    }

    .auth-subtitle {
      font-size: 13.5px;
      color: var(--color-text-secondary);
    }

    .alert {
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-sm);
      font-size: 13px;
      margin-bottom: var(--space-4);
      line-height: 1.4;
    }

    .alert-error {
      background: var(--color-error-soft);
      color: var(--color-error);
      border: 1px solid rgba(179, 38, 30, 0.2);
    }

    .alert-warning {
      background: var(--color-warning-soft);
      color: var(--color-warning);
      border: 1px solid rgba(165, 98, 10, 0.2);
    }

    .alert-info {
      background: var(--color-info-soft);
      color: var(--color-info);
      border: 1px solid rgba(36, 100, 180, 0.2);
    }

    .wrong-portal-box {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .wrong-portal-box strong {
      display: block;
      font-size: 13.5px;
      margin-bottom: 2px;
    }

    .wrong-portal-box p {
      font-size: 12.5px;
      margin: 0;
    }

    .redirect-btn {
      align-self: flex-start;
      margin-top: 2px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      margin-bottom: var(--space-4);
    }

    .field label {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text);
    }

    .field input {
      padding: 10px 14px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: 14px;
      color: var(--color-text);
      background: #fff;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .field input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-soft);
    }

    .field input.invalid {
      border-color: var(--color-error);
    }

    .password-wrapper {
      position: relative;
      display: flex;
    }

    .password-wrapper input {
      width: 100%;
      padding-right: 42px;
    }

    .password-toggle {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: var(--color-muted);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 6px;
      border-radius: var(--radius-sm);
    }

    .password-toggle:hover {
      color: var(--color-text);
    }

    .error-text {
      font-size: 12px;
      color: var(--color-error);
    }

    .submit-btn {
      width: 100%;
      padding: 12px 18px;
      font-size: 14.5px;
      margin-top: var(--space-2);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-footer {
      margin-top: var(--space-6);
      padding-top: var(--space-4);
      border-top: 1px solid var(--color-border);
      text-align: center;
      font-size: 13px;
      color: var(--color-text-secondary);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .auth-footer a {
      color: var(--color-primary);
      font-weight: 600;
      text-decoration: none;
    }

    .auth-footer a:hover {
      text-decoration: underline;
    }

    .switch-portal-link a {
      color: var(--color-muted);
      font-size: 12px;
      font-weight: 500;
    }
  `],
})
export class CustomerLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly wrongPortalRole = signal<'AGENT' | 'ADMIN' | null>(null);
  readonly showPassword = signal(false);
  readonly sessionExpired = signal(this.route.snapshot.queryParamMap.get('expired') === 'true');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.wrongPortalRole.set(null);
    this.submitting.set(true);

    this.auth
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (response) => {
          const userRole = response.data.user.role;
          if (userRole !== 'CUSTOMER') {
            // Wrong portal login detection
            this.wrongPortalRole.set(userRole as 'AGENT' | 'ADMIN');
            return;
          }
          this.router.navigateByUrl('/customer/dashboard');
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error as ErrorResponse | undefined;
          if (error.status === 0) {
            this.errorMessage.set("We couldn't connect to DeliveryHub. Check your network or try again.");
          } else {
            this.errorMessage.set(body?.message ?? 'Email or password is incorrect.');
          }
        },
      });
  }

  continueToCorrectPortal(role: 'AGENT' | 'ADMIN'): void {
    if (role === 'AGENT') {
      this.router.navigateByUrl('/agent/dashboard');
    } else {
      this.router.navigateByUrl('/admin/dashboard');
    }
  }
}
