import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { of, throwError } from 'rxjs';
import { UsersListComponent } from './users-list.component';
import { UserService, UserProfile } from '../../../../core/services/user.service';
import { AuthService, User } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

describe('UsersListComponent', () => {
  let component: UsersListComponent;
  let fixture: ComponentFixture<UsersListComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let currentUser$: BehaviorSubject<User | null>;

  const mockAdmin: UserProfile = {
    id: 1,
    email: 'admin@crm.local',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockRegularUser: UserProfile = {
    id: 2,
    email: 'user@crm.local',
    firstName: 'Regular',
    lastName: 'User',
    role: 'USER',
    active: true,
    createdAt: '2024-02-01T00:00:00Z',
  };

  const mockAuthUser: User = {
    id: '1',
    email: 'admin@crm.local',
    name: 'Admin User',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getAll', 'createUser', 'updateUser']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['add']);
    currentUser$ = new BehaviorSubject<User | null>(mockAuthUser);
    const mockAuthService = { currentUser$: currentUser$ };

    userServiceSpy.getAll.and.returnValue(of([mockAdmin, mockRegularUser]));

    await TestBed.configureTestingModule({
      imports: [UsersListComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit / loadUsers()', () => {
    it('should set currentUserId from authService and load users', () => {
      expect(component.currentUserId).toBe('1');
      expect(component.users).toEqual([mockAdmin, mockRegularUser]);
      expect(component.loading).toBeFalse();
    });

    it('should set currentUserId to null when no current user', async () => {
      currentUser$.next(null);
      userServiceSpy.getAll.and.returnValue(of([]));
      const fixture2 = TestBed.createComponent(UsersListComponent);
      fixture2.detectChanges();
      expect(fixture2.componentInstance.currentUserId).toBeNull();
    });

    it('should show error toast and clear loading on load error', () => {
      userServiceSpy.getAll.and.returnValue(throwError(() => new Error('500')));
      component.loadUsers();
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to load users', 'error');
      expect(component.loading).toBeFalse();
    });
  });

  describe('toggleInviteForm()', () => {
    it('should show invite form on first call', () => {
      expect(component.showInviteForm).toBeFalse();
      component.toggleInviteForm();
      expect(component.showInviteForm).toBeTrue();
    });

    it('should hide form and reset it on second call', () => {
      component.toggleInviteForm();
      component.inviteForm.setValue({
        email: 'test@test.com', firstName: 'A', lastName: 'B', password: 'Pass1234!', role: 'USER',
      });
      component.toggleInviteForm();
      expect(component.showInviteForm).toBeFalse();
      expect(component.inviteForm.value.email).toBe('');
    });
  });

  describe('inviteUser()', () => {
    beforeEach(() => component.toggleInviteForm());

    it('should mark all touched and not call API when form is invalid', () => {
      component.inviteUser();
      expect(userServiceSpy.createUser).not.toHaveBeenCalled();
      expect(component.inviteForm.controls.email.touched).toBeTrue();
    });

    it('should create user, show toast, hide form, and reload on success', () => {
      userServiceSpy.createUser.and.returnValue(of(mockRegularUser));
      component.inviteForm.setValue({
        email: 'new@crm.local',
        firstName: 'New',
        lastName: 'Person',
        password: 'Password1!',
        role: 'USER',
      });
      component.inviteUser();
      expect(userServiceSpy.createUser).toHaveBeenCalledWith({
        email: 'new@crm.local',
        firstName: 'New',
        lastName: 'Person',
        password: 'Password1!',
        role: 'USER',
      });
      expect(toastServiceSpy.add).toHaveBeenCalledWith('User invited', 'success');
      expect(component.showInviteForm).toBeFalse();
      expect(component.submittingInvite).toBeFalse();
    });

    it('should pass ADMIN role when selected', () => {
      userServiceSpy.createUser.and.returnValue(of(mockAdmin));
      component.inviteForm.setValue({
        email: 'admin2@crm.local',
        firstName: 'Admin',
        lastName: 'Two',
        password: 'Password1!',
        role: 'ADMIN',
      });
      component.inviteUser();
      const req = userServiceSpy.createUser.calls.mostRecent().args[0];
      expect(req.role).toBe('ADMIN');
    });

    it('should show error toast and reset submitting on error', () => {
      userServiceSpy.createUser.and.returnValue(throwError(() => new Error('500')));
      component.inviteForm.setValue({
        email: 'new@crm.local',
        firstName: 'New',
        lastName: 'Person',
        password: 'Password1!',
        role: 'USER',
      });
      component.inviteUser();
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to invite user', 'error');
      expect(component.submittingInvite).toBeFalse();
    });
  });

  describe('changeRole()', () => {
    it('should PATCH role and show success toast on success', () => {
      userServiceSpy.updateUser.and.returnValue(of(mockRegularUser));
      component.changeRole(mockRegularUser, 'ADMIN');
      expect(userServiceSpy.updateUser).toHaveBeenCalledWith(2, { role: 'ADMIN' });
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Role updated', 'success');
    });

    it('should show error toast on failure', () => {
      userServiceSpy.updateUser.and.returnValue(throwError(() => new Error('500')));
      component.changeRole(mockRegularUser, 'ADMIN');
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to update role', 'error');
    });
  });

  describe('onRoleChange()', () => {
    it('should call changeRole with the selected value', () => {
      userServiceSpy.updateUser.and.returnValue(of(mockRegularUser));
      const fakeEvent = { target: { value: 'ADMIN' } } as unknown as Event;
      component.onRoleChange(mockRegularUser, fakeEvent);
      expect(userServiceSpy.updateUser).toHaveBeenCalledWith(2, { role: 'ADMIN' });
    });
  });

  describe('toggleActive()', () => {
    it('should PATCH active=false and show deactivated toast when user is active', () => {
      userServiceSpy.updateUser.and.returnValue(of({ ...mockRegularUser, active: false }));
      component.toggleActive(mockRegularUser);
      expect(userServiceSpy.updateUser).toHaveBeenCalledWith(2, { active: false });
      expect(toastServiceSpy.add).toHaveBeenCalledWith('User deactivated', 'success');
    });

    it('should PATCH active=true and show activated toast when user is inactive', () => {
      const inactiveUser = { ...mockRegularUser, active: false };
      userServiceSpy.updateUser.and.returnValue(of({ ...inactiveUser, active: true }));
      component.toggleActive(inactiveUser);
      expect(userServiceSpy.updateUser).toHaveBeenCalledWith(2, { active: true });
      expect(toastServiceSpy.add).toHaveBeenCalledWith('User activated', 'success');
    });

    it('should show error toast on failure', () => {
      userServiceSpy.updateUser.and.returnValue(throwError(() => new Error('500')));
      component.toggleActive(mockRegularUser);
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to update user', 'error');
    });
  });

  describe('isSelf()', () => {
    it('should return true when user id matches currentUserId', () => {
      expect(component.isSelf(mockAdmin)).toBeTrue();
    });

    it('should return false when user id does not match currentUserId', () => {
      expect(component.isSelf(mockRegularUser)).toBeFalse();
    });
  });

  describe('initials()', () => {
    it('should return uppercase initials from first and last name', () => {
      expect(component.initials(mockAdmin)).toBe('AU');
      expect(component.initials(mockRegularUser)).toBe('RU');
    });
  });

  describe('template', () => {
    it('should render user rows', () => {
      fixture.detectChanges();
      const rows = fixture.nativeElement.querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    });

    it('should not show deactivate button for the current user', () => {
      fixture.detectChanges();
      const rows = fixture.nativeElement.querySelectorAll('tbody tr');
      const firstRowBtn = rows[0].querySelector('button');
      expect(firstRowBtn).toBeNull();
    });

    it('should show deactivate button for other users', () => {
      fixture.detectChanges();
      const rows = fixture.nativeElement.querySelectorAll('tbody tr');
      const secondRowBtn = rows[1].querySelector('button');
      expect(secondRowBtn?.textContent?.trim()).toBe('Deactivate');
    });

    it('should show invite form when toggled', () => {
      component.toggleInviteForm();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.invite-form')).toBeTruthy();
    });
  });
});
