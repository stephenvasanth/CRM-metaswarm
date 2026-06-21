import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render email and password fields', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('#email')).toBeTruthy();
    expect(el.querySelector('#password')).toBeTruthy();
  });

  it('should render the sign-in button', () => {
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(btn.textContent?.trim()).toBe('Sign in');
  });

  it('should start with invalid form', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('should show email required error when email touched and empty', () => {
    component.form.controls.email.markAsTouched();
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('.form-field__error');
    expect(error?.textContent).toContain('Email is required');
  });

  it('should show email format error for invalid email', () => {
    component.form.controls.email.setValue('notanemail');
    component.form.controls.email.markAsTouched();
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('.form-field__error');
    expect(error?.textContent).toContain('valid email');
  });

  it('should show password required error when password touched and empty', () => {
    component.form.controls.password.markAsTouched();
    fixture.detectChanges();
    const errors = fixture.nativeElement.querySelectorAll('.form-field__error');
    const texts = Array.from(errors).map((e: any) => e.textContent);
    expect(texts.some((t: string) => t.includes('Password is required'))).toBeTrue();
  });

  it('should mark all fields touched and not call login on submit with empty form', () => {
    component.onSubmit();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
    expect(component.form.controls.email.touched).toBeTrue();
    expect(component.form.controls.password.touched).toBeTrue();
  });

  it('should call authService.login with form values on valid submit', () => {
    authServiceSpy.login.and.returnValue(of(undefined));
    component.form.setValue({ email: 'admin@crm.local', password: 'Admin1234!' });
    component.onSubmit();
    expect(authServiceSpy.login).toHaveBeenCalledWith('admin@crm.local', 'Admin1234!');
  });

  it('should navigate to /dashboard on login success', () => {
    authServiceSpy.login.and.returnValue(of(undefined));
    component.form.setValue({ email: 'admin@crm.local', password: 'Admin1234!' });
    component.onSubmit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show error message on login failure', () => {
    authServiceSpy.login.and.returnValue(throwError(() => ({ status: 401 })));
    component.form.setValue({ email: 'admin@crm.local', password: 'wrongpassword' });
    component.onSubmit();
    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('.login-error');
    expect(error?.textContent).toContain('Invalid email or password');
  });

  it('should reset submitting to false on login failure', () => {
    authServiceSpy.login.and.returnValue(throwError(() => ({ status: 401 })));
    component.form.setValue({ email: 'admin@crm.local', password: 'wrong' });
    component.onSubmit();
    expect(component.submitting).toBeFalse();
  });

  it('should set submitting to false on login success', () => {
    authServiceSpy.login.and.returnValue(of(undefined));
    component.form.setValue({ email: 'admin@crm.local', password: 'Admin1234!' });
    component.onSubmit();
    expect(component.submitting).toBeFalse();
  });

  it('should clear errorMessage on new submit attempt', () => {
    authServiceSpy.login.and.returnValue(of(undefined));
    component.errorMessage = 'previous error';
    component.form.setValue({ email: 'admin@crm.local', password: 'Admin1234!' });
    component.onSubmit();
    expect(component.errorMessage).toBe('');
  });
});
