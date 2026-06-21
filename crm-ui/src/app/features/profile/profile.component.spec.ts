import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { of, throwError } from 'rxjs';
import { ProfileComponent } from './profile.component';
import { UserService, UserProfile } from '../../core/services/user.service';
import { AuthService, User } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let currentUser$: BehaviorSubject<User | null>;

  const mockProfile: UserProfile = {
    id: 1,
    email: 'admin@crm.local',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockAuthUser: User = {
    id: '1',
    email: 'admin@crm.local',
    name: 'Admin User',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getMe', 'updateMe']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['add']);
    currentUser$ = new BehaviorSubject<User | null>(mockAuthUser);
    const mockAuthService = { currentUser$: currentUser$ };

    userServiceSpy.getMe.and.returnValue(of(mockProfile));

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit / loadProfile()', () => {
    it('should load profile and patch form on success', () => {
      expect(component.profile).toEqual(mockProfile);
      expect(component.form.value.firstName).toBe('Admin');
      expect(component.form.value.lastName).toBe('User');
      expect(component.loading).toBeFalse();
    });

    it('should show toast and clear loading on error', async () => {
      userServiceSpy.getMe.and.returnValue(throwError(() => new Error('500')));
      component.loadProfile();
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to load profile', 'error');
      expect(component.loading).toBeFalse();
    });
  });

  describe('initials getter', () => {
    it('should return uppercase initials when profile is loaded', () => {
      expect(component.initials).toBe('AU');
    });

    it('should return empty string when profile is null', () => {
      component.profile = null;
      expect(component.initials).toBe('');
    });
  });

  describe('save()', () => {
    it('should mark all touched and not call API when form is invalid', () => {
      component.form.controls.firstName.setValue('');
      component.save();
      expect(userServiceSpy.updateMe).not.toHaveBeenCalled();
      expect(component.form.controls.firstName.touched).toBeTrue();
    });

    it('should call updateMe without password when password field is empty', () => {
      userServiceSpy.updateMe.and.returnValue(of(mockProfile));
      component.form.setValue({ firstName: 'Jane', lastName: 'Doe', password: '' });
      component.save();
      const body = userServiceSpy.updateMe.calls.mostRecent().args[0];
      expect(body.firstName).toBe('Jane');
      expect(body.lastName).toBe('Doe');
      expect(body.password).toBeUndefined();
    });

    it('should include password in request when password field is non-empty', () => {
      userServiceSpy.updateMe.and.returnValue(of(mockProfile));
      component.form.setValue({ firstName: 'Jane', lastName: 'Doe', password: 'NewPass1!' });
      component.save();
      const body = userServiceSpy.updateMe.calls.mostRecent().args[0];
      expect(body.password).toBe('NewPass1!');
    });

    it('should update profile and update currentUser$ name on success', () => {
      const updatedProfile: UserProfile = { ...mockProfile, firstName: 'Jane', lastName: 'Doe' };
      userServiceSpy.updateMe.and.returnValue(of(updatedProfile));
      component.form.setValue({ firstName: 'Jane', lastName: 'Doe', password: '' });
      component.save();
      expect(component.profile).toEqual(updatedProfile);
      expect(currentUser$.value?.name).toBe('Jane Doe');
    });

    it('should not crash when currentUser$ is null on save success', () => {
      currentUser$.next(null);
      const updatedProfile: UserProfile = { ...mockProfile, firstName: 'Jane', lastName: 'Doe' };
      userServiceSpy.updateMe.and.returnValue(of(updatedProfile));
      component.form.setValue({ firstName: 'Jane', lastName: 'Doe', password: '' });
      component.save();
      expect(component.profile).toEqual(updatedProfile);
    });

    it('should show success toast and reset password field on success', () => {
      userServiceSpy.updateMe.and.returnValue(of(mockProfile));
      component.form.setValue({ firstName: 'Admin', lastName: 'User', password: 'NewPass1!' });
      component.save();
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Profile updated', 'success');
      expect(component.form.value.password).toBe('');
      expect(component.saving).toBeFalse();
    });

    it('should show error toast and reset saving on error', () => {
      userServiceSpy.updateMe.and.returnValue(throwError(() => new Error('500')));
      component.form.setValue({ firstName: 'Admin', lastName: 'User', password: '' });
      component.save();
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to update profile', 'error');
      expect(component.saving).toBeFalse();
    });

    it('should set saving to true during API call', () => {
      let savingDuring = false;
      userServiceSpy.updateMe.and.callFake(() => {
        savingDuring = component.saving;
        return of(mockProfile);
      });
      component.form.setValue({ firstName: 'Admin', lastName: 'User', password: '' });
      component.save();
      expect(savingDuring).toBeTrue();
    });
  });

  describe('template', () => {
    it('should render the form when profile is loaded', () => {
      fixture.detectChanges();
      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('#firstName')).toBeTruthy();
      expect(el.querySelector('#lastName')).toBeTruthy();
      expect(el.querySelector('#password')).toBeTruthy();
    });

    it('should render the avatar with initials', () => {
      fixture.detectChanges();
      const avatar: HTMLElement = fixture.nativeElement.querySelector('.profile-avatar');
      expect(avatar?.textContent?.trim()).toBe('AU');
    });

    it('should render the role badge', () => {
      fixture.detectChanges();
      const badge: HTMLElement = fixture.nativeElement.querySelector('.role-badge');
      expect(badge?.textContent?.trim()).toBe('ADMIN');
    });
  });
});
