import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { ErrorResponse } from '../../../core/models/api-response.model';
import { ToastService } from '../../../shared/components/toast.service';
import { AuthLayoutComponent } from '../shared/auth-layout.component';
import { IconComponent } from '../../../shared/components/icon.component';

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  if (password && confirmPassword && password !== confirmPassword) {
    return { passwordMismatch: true };
  }
  return null;
}

@Component({
  selector: 'dh-customer-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthLayoutComponent, IconComponent],
  template: `
    <dh-auth-layout
      headline="Register for DeliveryHub"
      subheadline="Create your customer account to start booking courier pickups and tracking shipments."
    >
      <div class="auth-header">
        <div class="role-badge">Customer Registration</div>
        <h2 class="auth-title">Create account</h2>
        <p class="auth-subtitle">Sign up to send and track your deliveries across India.</p>
      </div>

      @if (errorMessage()) {
        <div class="alert alert-error" role="alert">{{ errorMessage() }}</div>
      }

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="fullName">Full name</label>
          <input
            id="fullName"
            type="text"
            formControlName="fullName"
            autocomplete="name"
            placeholder="e.g. Rahul Sharma"
            [class.invalid]="form.controls.fullName.invalid && form.controls.fullName.touched"
          />
          @if (form.controls.fullName.invalid && form.controls.fullName.touched) {
            <span class="error-text">Full name is required (minimum 2 characters).</span>
          }
        </div>

        <div class="field">
          <label for="reg-email">Email address</label>
          <input
            id="reg-email"
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
          <label for="reg-phone">Phone number</label>
          <input
            id="reg-phone"
            type="tel"
            formControlName="phone"
            autocomplete="tel"
            placeholder="+91 98000 00000"
            [class.invalid]="form.controls.phone.invalid && form.controls.phone.touched"
          />
          @if (form.controls.phone.invalid && form.controls.phone.touched) {
            <span class="error-text">Phone number is required.</span>
          }
        </div>

        <div class="field">
          <label for="reg-password">Password</label>
          <div class="password-wrapper">
            <input
              id="reg-password"
              [type]="showPassword() ? 'text' : 'password'"
              formControlName="password"
              autocomplete="new-password"
              placeholder="Minimum 8 characters"
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
            <span class="error-text">Password must contain at least 8 characters.</span>
          }
        </div>

        <div class="field">
          <label for="confirmPassword">Confirm password</label>
          <div class="password-wrapper">
            <input
              id="confirmPassword"
              [type]="showConfirmPassword() ? 'text' : 'password'"
              formControlName="confirmPassword"
              autocomplete="new-password"
              placeholder="Re-enter your password"
              [class.invalid]="form.hasError('passwordMismatch') && form.controls.confirmPassword.touched"
            />
            <button
              type="button"
              class="password-toggle"
              (click)="toggleConfirmPasswordVisibility()"
              [attr.aria-label]="showConfirmPassword() ? 'Hide password' : 'Show password'"
            >
              <dh-icon [name]="showConfirmPassword() ? 'eye-off' : 'eye'"></dh-icon>
            </button>
          </div>
          @if (form.hasError('passwordMismatch') && form.controls.confirmPassword.touched) {
            <span class="error-text">Passwords do not match.</span>
          }
        </div>

        <button
          type="submit"
          class="btn btn-primary submit-btn"
          [disabled]="submitting()"
        >
          @if (submitting()) {
            <span class="btn-spinner"></span>
            <span>Creating account…</span>
          } @else {
            <span>Create Customer Account</span>
          }
        </button>
      </form>

      <div class="auth-footer">
        <p>Already have an account? <a routerLink="/customer/login">Sign in</a></p>
        <p class="switch-portal-link">
          <a routerLink="/login">← Switch access portal</a>
        </p>
      </div>
    </dh-auth-layout>
  `,
  styles: [`
    .auth-header {
      margin-bottom: var(--space-5);
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
    }

    .alert-error {
      background: var(--color-error-soft);
      color: var(--color-error);
      border: 1px solid rgba(179, 38, 30, 0.2);
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      margin-bottom: var(--space-3);
    }

    .field label {
      font-size: 13px;
      font-weight: 600;
      color: var(--color-text);
    }

    .field input {
      padding: 9px 13px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: 13.5px;
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
      padding: 11px 18px;
      font-size: 14px;
      margin-top: var(--space-3);
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
      margin-top: var(--space-5);
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
export class CustomerRegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(8)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [passwordMatchValidator] },
  );

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((v) => !v);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.submitting.set(true);

    const { fullName, email, phone, password } = this.form.getRawValue();

    this.auth
      .register({ fullName, email, phone, password })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.toast.show('Account created successfully! Please sign in.', 'success');
          this.router.navigate(['/customer/login']);
        },
        error: (error: HttpErrorResponse) => {
          const body = error.error as ErrorResponse | undefined;
          if (error.status === 409) {
            this.errorMessage.set('An account with this email already exists.');
          } else {
            this.errorMessage.set(body?.message ?? 'Unable to create account right now.');
          }
        },
      });
  }
}
