import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastService } from './core/services/toast.service';
import { BehaviorSubject } from 'rxjs';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    const toastServiceMock = {
      toasts$: new BehaviorSubject([]).asObservable(),
      add: jasmine.createSpy('add'),
      remove: jasmine.createSpy('remove')
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule],
      providers: [{ provide: ToastService, useValue: toastServiceMock }]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render router-outlet', () => {
    const routerOutlet = fixture.nativeElement.querySelector('router-outlet');
    expect(routerOutlet).toBeTruthy();
  });

  it('should render toast component', () => {
    const toast = fixture.nativeElement.querySelector('app-toast');
    expect(toast).toBeTruthy();
  });
});
