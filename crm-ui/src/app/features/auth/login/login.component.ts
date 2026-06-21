import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-card__header">
          <h1 class="login-card__title">CRM</h1>
          <p class="login-card__subtitle">Sign in to your account</p>
        </div>

        @if (errorMessage) {
          <div class="login-error" role="alert">{{ errorMessage }}</div>
        }

        <form class="login-form" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="form-field">
            <label for="email" class="form-field__label">Email</label>
            <input
              id="email"
              type="email"
              class="form-field__input"
              [class.form-field__input--error]="isFieldInvalid('email')"
              formControlName="email"
              placeholder="you@example.com"
              autocomplete="email"
              autofocus
            />
            @if (isFieldInvalid('email') && form.controls.email.hasError('required')) {
              <p class="form-field__error" role="alert">Email is required.</p>
            } @else if (isFieldInvalid('email') && form.controls.email.hasError('email')) {
              <p class="form-field__error" role="alert">Enter a valid email address.</p>
            }
          </div>

          <div class="form-field">
            <label for="password" class="form-field__label">Password</label>
            <input
              id="password"
              type="password"
              class="form-field__input"
              [class.form-field__input--error]="isFieldInvalid('password')"
              formControlName="password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            @if (isFieldInvalid('password')) {
              <p class="form-field__error" role="alert">Password is required.</p>
            }
          </div>

          <button
            type="submit"
            class="btn btn--primary"
            [disabled]="submitting"
          >{{ submitting ? 'Signing in…' : 'Sign in' }}</button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-background);
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-8);
      box-shadow: var(--shadow-md);
    }

    .login-card__header {
      text-align: center;
      margin-bottom: var(--space-6);
    }

    .login-card__title {
      font-size: var(--font-size-2xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-primary);
      letter-spacing: 0.05em;
      margin-bottom: var(--space-1);
    }

    .login-card__subtitle {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .login-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-4);
      color: var(--color-danger);
      font-size: var(--font-size-sm);
      margin-bottom: var(--space-4);
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .form-field__label {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    .form-field__input {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      background: var(--color-surface);
      width: 100%;
    }

    .form-field__input:focus {
      border-color: var(--color-primary);
      outline: none;
    }

    .form-field__input--error {
      border-color: var(--color-danger);
    }

    .form-field__error {
      font-size: var(--font-size-sm);
      color: var(--color-danger);
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-md);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      border: none;
      cursor: pointer;
      transition: background-color 150ms;
      margin-top: var(--space-2);
    }

    .btn--primary {
      background-color: var(--color-primary);
      color: var(--color-surface);
      width: 100%;
    }

    .btn--primary:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
    }

    .btn--primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `],
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  submitting = false;
  errorMessage = '';

  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.submitting = true;
    this.errorMessage = '';

    this.authService.login(email, password).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.submitting = false;
        this.errorMessage = 'Invalid email or password.';
      },
    });
  }
}
