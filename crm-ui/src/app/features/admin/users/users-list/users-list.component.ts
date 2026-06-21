import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService, UserProfile, CreateUserRequest, UpdateUserRequest } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="users-admin">
      <div class="users-admin__header">
        <h1 class="users-admin__title">Users</h1>
        <button type="button" class="btn btn--primary" (click)="toggleInviteForm()">
          {{ showInviteForm ? 'Cancel' : 'Invite User' }}
        </button>
      </div>

      @if (showInviteForm) {
        <form [formGroup]="inviteForm" (ngSubmit)="inviteUser()" class="invite-form">
          <h2 class="invite-form__title">Invite New User</h2>
          <div class="invite-form__grid">
            <div class="field">
              <label for="inviteFirstName">First Name</label>
              <input
                id="inviteFirstName"
                type="text"
                formControlName="firstName"
                [class.field--error]="inviteForm.controls.firstName.invalid && inviteForm.controls.firstName.touched"
              />
              @if (inviteForm.controls.firstName.invalid && inviteForm.controls.firstName.touched) {
                <span class="field__error">First name is required</span>
              }
            </div>

            <div class="field">
              <label for="inviteLastName">Last Name</label>
              <input
                id="inviteLastName"
                type="text"
                formControlName="lastName"
                [class.field--error]="inviteForm.controls.lastName.invalid && inviteForm.controls.lastName.touched"
              />
              @if (inviteForm.controls.lastName.invalid && inviteForm.controls.lastName.touched) {
                <span class="field__error">Last name is required</span>
              }
            </div>

            <div class="field">
              <label for="inviteEmail">Email</label>
              <input
                id="inviteEmail"
                type="email"
                formControlName="email"
                [class.field--error]="inviteForm.controls.email.invalid && inviteForm.controls.email.touched"
              />
              @if (inviteForm.controls.email.invalid && inviteForm.controls.email.touched) {
                <span class="field__error">Valid email is required</span>
              }
            </div>

            <div class="field">
              <label for="invitePassword">Password</label>
              <input
                id="invitePassword"
                type="password"
                formControlName="password"
                autocomplete="new-password"
                [class.field--error]="inviteForm.controls.password.invalid && inviteForm.controls.password.touched"
              />
              @if (inviteForm.controls.password.invalid && inviteForm.controls.password.touched) {
                <span class="field__error">Password must be at least 8 characters</span>
              }
            </div>

            <div class="field">
              <label for="inviteRole">Role</label>
              <select id="inviteRole" formControlName="role">
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          <div class="invite-form__actions">
            <button type="submit" class="btn btn--primary" [disabled]="submittingInvite">
              {{ submittingInvite ? 'Inviting…' : 'Send Invite' }}
            </button>
          </div>
        </form>
      }

      @if (loading) {
        <p class="users-admin__loading">Loading users…</p>
      } @else {
        <table class="users-table" aria-label="Users">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (user of users; track user.id) {
              <tr [class.users-table__row--inactive]="!user.active">
                <td>
                  <div class="user-avatar">{{ initials(user) }}</div>
                </td>
                <td class="user-name">{{ user.firstName }} {{ user.lastName }}</td>
                <td class="user-email">{{ user.email }}</td>
                <td>
                  <select
                    [value]="user.role"
                    [disabled]="isSelf(user)"
                    (change)="onRoleChange(user, $event)"
                    class="role-select"
                    aria-label="Change role"
                  >
                    <option value="USER">User</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </td>
                <td>
                  <span class="status-badge" [class.status-badge--active]="user.active">
                    {{ user.active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="user-joined">{{ user.createdAt | date:'MMM d, y' }}</td>
                <td>
                  @if (!isSelf(user)) {
                    <button
                      type="button"
                      class="btn btn--ghost btn--sm"
                      [class.btn--danger]="user.active"
                      (click)="toggleActive(user)"
                    >
                      {{ user.active ? 'Deactivate' : 'Activate' }}
                    </button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .users-admin { padding: var(--space-6); }
    .users-admin__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-6);
    }
    .users-admin__title { margin: 0; }
    .users-admin__loading { color: var(--color-text-secondary); }

    .invite-form {
      background: var(--color-surface-raised);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-5);
      margin-bottom: var(--space-6);
    }
    .invite-form__title { margin: 0 0 var(--space-4); font-size: var(--font-size-lg); }
    .invite-form__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }
    .invite-form__actions { display: flex; gap: var(--space-3); }
    .field { display: flex; flex-direction: column; gap: var(--space-1); }
    .field label { font-size: var(--font-size-sm); font-weight: 500; }
    .field input, .field select {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-base);
      background: var(--color-surface);
      color: var(--color-text-primary);
    }
    .field--error input, .field--error select { border-color: var(--color-error); }
    .field__error { color: var(--color-error); font-size: var(--font-size-xs); }

    .users-table { width: 100%; border-collapse: collapse; }
    .users-table th, .users-table td {
      padding: var(--space-3) var(--space-4);
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }
    .users-table th { font-size: var(--font-size-xs); font-weight: 600; text-transform: uppercase; color: var(--color-text-secondary); }
    .users-table__row--inactive { opacity: 0.6; }

    .user-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--color-primary);
      color: var(--color-white);
      font-size: var(--font-size-sm);
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .user-name { font-weight: 500; }
    .user-email { color: var(--color-text-secondary); font-size: var(--font-size-sm); }
    .user-joined { color: var(--color-text-secondary); font-size: var(--font-size-sm); white-space: nowrap; }

    .role-select {
      padding: var(--space-1) var(--space-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-sm);
      background: var(--color-surface);
      cursor: pointer;
    }
    .role-select:disabled { opacity: 0.5; cursor: default; }

    .status-badge {
      display: inline-block;
      padding: 2px var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-xs);
      font-weight: 500;
      background: var(--color-surface-raised);
      color: var(--color-text-secondary);
    }
    .status-badge--active { background: var(--color-success-bg, #d1fae5); color: var(--color-success, #065f46); }

    .btn--sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-sm); }
    .btn--ghost {
      background: none;
      border: 1px solid var(--color-border);
      color: var(--color-text-secondary);
      cursor: pointer;
      border-radius: var(--radius-sm);
    }
    .btn--danger { border-color: var(--color-error); color: var(--color-error); }
  `],
})
export class UsersListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  users: UserProfile[] = [];
  loading = false;
  showInviteForm = false;
  submittingInvite = false;
  currentUserId: string | null = null;

  inviteForm: FormGroup<{
    email: FormControl<string>;
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    password: FormControl<string>;
    role: FormControl<string>;
  }> = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['USER'],
  });

  ngOnInit(): void {
    this.currentUserId = this.authService.currentUser$.value?.id ?? null;
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAll().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: () => {
        this.toastService.add('Failed to load users', 'error');
        this.loading = false;
      },
    });
  }

  toggleInviteForm(): void {
    this.showInviteForm = !this.showInviteForm;
    if (!this.showInviteForm) {
      this.inviteForm.reset({ email: '', firstName: '', lastName: '', password: '', role: 'USER' });
    }
  }

  inviteUser(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }
    this.submittingInvite = true;
    const req: CreateUserRequest = {
      email: this.inviteForm.value.email!,
      firstName: this.inviteForm.value.firstName!,
      lastName: this.inviteForm.value.lastName!,
      password: this.inviteForm.value.password!,
      role: this.inviteForm.value.role as 'USER' | 'ADMIN',
    };
    this.userService.createUser(req).subscribe({
      next: () => {
        this.toastService.add('User invited', 'success');
        this.showInviteForm = false;
        this.inviteForm.reset({ email: '', firstName: '', lastName: '', password: '', role: 'USER' });
        this.submittingInvite = false;
        this.loadUsers();
      },
      error: () => {
        this.toastService.add('Failed to invite user', 'error');
        this.submittingInvite = false;
      },
    });
  }

  onRoleChange(user: UserProfile, event: Event): void {
    const role = (event.target as HTMLSelectElement).value as 'USER' | 'ADMIN';
    this.changeRole(user, role);
  }

  changeRole(user: UserProfile, role: 'USER' | 'ADMIN'): void {
    const req: UpdateUserRequest = { role };
    this.userService.updateUser(user.id, req).subscribe({
      next: () => {
        this.toastService.add('Role updated', 'success');
        this.loadUsers();
      },
      error: () => this.toastService.add('Failed to update role', 'error'),
    });
  }

  toggleActive(user: UserProfile): void {
    const req: UpdateUserRequest = { active: !user.active };
    this.userService.updateUser(user.id, req).subscribe({
      next: () => {
        this.toastService.add(user.active ? 'User deactivated' : 'User activated', 'success');
        this.loadUsers();
      },
      error: () => this.toastService.add('Failed to update user', 'error'),
    });
  }

  isSelf(user: UserProfile): boolean {
    return String(user.id) === this.currentUserId;
  }

  initials(user: UserProfile): string {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }
}
