import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService, UserProfile, UpdateProfileRequest } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-page">
      @if (loading) {
        <p class="profile-page__loading">Loading profile…</p>
      } @else if (profile) {
        <div class="profile-page__header">
          <div class="profile-avatar">{{ initials }}</div>
          <div class="profile-page__meta">
            <h1 class="profile-page__name">{{ profile.firstName }} {{ profile.lastName }}</h1>
            <p class="profile-page__email">{{ profile.email }}</p>
            <span class="role-badge role-badge--{{ profile.role.toLowerCase() }}">
              {{ profile.role }}
            </span>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="save()" class="profile-form">
          <h2 class="profile-form__title">Edit Profile</h2>

          <div class="form-row">
            <div class="field">
              <label for="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                formControlName="firstName"
                [class.field--error]="form.controls.firstName.invalid && form.controls.firstName.touched"
              />
              @if (form.controls.firstName.invalid && form.controls.firstName.touched) {
                <span class="field__error">First name is required</span>
              }
            </div>

            <div class="field">
              <label for="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                formControlName="lastName"
                [class.field--error]="form.controls.lastName.invalid && form.controls.lastName.touched"
              />
              @if (form.controls.lastName.invalid && form.controls.lastName.touched) {
                <span class="field__error">Last name is required</span>
              }
            </div>
          </div>

          <div class="field">
            <label for="password">
              New Password
              <span class="field__hint">(leave blank to keep current)</span>
            </label>
            <input
              id="password"
              type="password"
              formControlName="password"
              autocomplete="new-password"
              [class.field--error]="form.controls.password.invalid && form.controls.password.touched"
            />
            @if (form.controls.password.errors?.['minlength'] && form.controls.password.touched) {
              <span class="field__error">Password must be at least 8 characters</span>
            }
          </div>

          <div class="profile-form__actions">
            <button type="submit" class="btn btn--primary" [disabled]="saving">
              {{ saving ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .profile-page { padding: var(--space-6); max-width: 640px; }
    .profile-page__loading { color: var(--color-text-secondary); }
    .profile-page__header {
      display: flex;
      align-items: center;
      gap: var(--space-5);
      margin-bottom: var(--space-8);
      padding-bottom: var(--space-6);
      border-bottom: 1px solid var(--color-border);
    }
    .profile-avatar {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--color-primary);
      color: var(--color-white);
      font-size: var(--font-size-xl);
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .profile-page__name { margin: 0 0 var(--space-1); font-size: var(--font-size-xl); }
    .profile-page__email { margin: 0 0 var(--space-2); color: var(--color-text-secondary); font-size: var(--font-size-sm); }
    .role-badge {
      display: inline-block;
      padding: 2px var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .role-badge--admin { background: var(--color-warning-bg, #fef3c7); color: var(--color-warning, #b45309); }
    .role-badge--user { background: var(--color-surface-raised); color: var(--color-text-secondary); }
    .profile-form__title { margin-bottom: var(--space-5); font-size: var(--font-size-lg); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-4); }
    .field { display: flex; flex-direction: column; gap: var(--space-1); margin-bottom: var(--space-4); }
    .form-row .field { margin-bottom: 0; }
    .field label { font-size: var(--font-size-sm); font-weight: 500; color: var(--color-text-primary); }
    .field__hint { font-weight: 400; color: var(--color-text-secondary); margin-left: var(--space-1); }
    .field input {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-base);
      background: var(--color-surface);
      color: var(--color-text-primary);
    }
    .field--error input { border-color: var(--color-error); }
    .field__error { color: var(--color-error); font-size: var(--font-size-xs); }
    .profile-form__actions { margin-top: var(--space-6); }
  `],
})
export class ProfileComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  profile: UserProfile | null = null;
  loading = false;
  saving = false;

  form: FormGroup<{
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    password: FormControl<string>;
  }> = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    password: ['', Validators.minLength(8)],
  });

  get initials(): string {
    if (!this.profile) return '';
    return `${this.profile.firstName.charAt(0)}${this.profile.lastName.charAt(0)}`.toUpperCase();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;
    this.userService.getMe().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.form.patchValue({ firstName: profile.firstName, lastName: profile.lastName, password: '' });
        this.loading = false;
      },
      error: () => {
        this.toastService.add('Failed to load profile', 'error');
        this.loading = false;
      },
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const req: UpdateProfileRequest = {
      firstName: this.form.value.firstName!,
      lastName: this.form.value.lastName!,
    };
    const pw = this.form.value.password;
    if (pw && pw.length > 0) req.password = pw;

    this.userService.updateMe(req).subscribe({
      next: (updated) => {
        this.profile = updated;
        const current = this.authService.currentUser$.value;
        if (current) {
          this.authService.currentUser$.next({
            ...current,
            name: `${updated.firstName} ${updated.lastName}`.trim(),
          });
        }
        this.form.patchValue({ password: '' });
        this.form.controls.password.markAsUntouched();
        this.toastService.add('Profile updated', 'success');
        this.saving = false;
      },
      error: () => {
        this.toastService.add('Failed to update profile', 'error');
        this.saving = false;
      },
    });
  }
}
