import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppShellComponent } from './app-shell.component';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../core/services/auth.service';
import { BehaviorSubject } from 'rxjs';

describe('AppShellComponent', () => {
  let component: AppShellComponent;
  let fixture: ComponentFixture<AppShellComponent>;

  beforeEach(async () => {
    const authServiceMock = {
      isAdmin$: new BehaviorSubject(false).asObservable(),
      currentUser$: new BehaviorSubject(null),
      logout: jasmine.createSpy('logout')
    };

    await TestBed.configureTestingModule({
      imports: [AppShellComponent, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(AppShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render sidebar', () => {
    const sidebar = fixture.nativeElement.querySelector('app-sidebar');
    expect(sidebar).toBeTruthy();
  });

  it('should render router-outlet', () => {
    const routerOutlet = fixture.nativeElement.querySelector('router-outlet');
    expect(routerOutlet).toBeTruthy();
  });

  it('should render main content area', () => {
    const main = fixture.nativeElement.querySelector('.main-content');
    expect(main).toBeTruthy();
  });
});
