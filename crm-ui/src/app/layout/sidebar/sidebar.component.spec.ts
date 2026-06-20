import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from './sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject } from 'rxjs';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let isAdmin$: BehaviorSubject<boolean>;

  beforeEach(async () => {
    isAdmin$ = new BehaviorSubject<boolean>(false);
    authService = jasmine.createSpyObj('AuthService', ['logout'], {
      isAdmin$: isAdmin$.asObservable(),
      currentUser$: new BehaviorSubject(null)
    });

    await TestBed.configureTestingModule({
      imports: [SidebarComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authService }]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all main nav links', () => {
    const links = fixture.nativeElement.querySelectorAll('.sidebar__nav-link');
    const labels = Array.from(links).map((l) =>
      (l as HTMLElement).querySelector('.sidebar__nav-label')?.textContent?.trim()
    );

    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Contacts');
    expect(labels).toContain('Deals');
    expect(labels).toContain('Activities');
    expect(labels).toContain('Tasks');
  });

  it('should render Profile and Sign Out links', () => {
    const profileLink = fixture.nativeElement.querySelector('a[aria-label="Profile"]');
    const logoutBtn = fixture.nativeElement.querySelector('.sidebar__logout');

    expect(profileLink).toBeTruthy();
    expect(logoutBtn).toBeTruthy();
  });

  it('should NOT show admin links for non-admin users', () => {
    isAdmin$.next(false);
    fixture.detectChanges();

    const adminSection = fixture.nativeElement.querySelector('.sidebar__section');
    expect(adminSection).toBeNull();
  });

  it('should show admin links for ADMIN users', async () => {
    isAdmin$.next(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const adminSection = fixture.nativeElement.querySelector('.sidebar__section');
    expect(adminSection).toBeTruthy();

    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.sidebar__nav-label')
    ).map((el) => (el as HTMLElement).textContent?.trim());

    expect(labels).toContain('Users');
    expect(labels).toContain('Tags');
  });

  it('should call authService.logout when Sign Out clicked', () => {
    const logoutBtn = fixture.nativeElement.querySelector('.sidebar__logout');
    logoutBtn.click();

    expect(authService.logout).toHaveBeenCalled();
  });

  it('should render logo text', () => {
    const logo = fixture.nativeElement.querySelector('.sidebar__logo-text');
    expect(logo.textContent.trim()).toBe('CRM');
  });

  it('should have mainNavItems defined', () => {
    expect(component.mainNavItems.length).toBe(5);
  });

  it('should have adminNavItems defined', () => {
    expect(component.adminNavItems.length).toBe(2);
  });
});
