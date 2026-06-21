import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService } from '../../../core/services/toast.service';
import { BehaviorSubject } from 'rxjs';
import { Toast } from '../../../core/services/toast.service';

describe('ToastComponent', () => {
  let component: ToastComponent;
  let fixture: ComponentFixture<ToastComponent>;
  let toastService: jasmine.SpyObj<ToastService>;
  let toasts$: BehaviorSubject<Toast[]>;

  beforeEach(async () => {
    toasts$ = new BehaviorSubject<Toast[]>([]);
    toastService = jasmine.createSpyObj('ToastService', ['remove', 'add'], {
      toasts$: toasts$.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [{ provide: ToastService, useValue: toastService }]
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render toasts from service', () => {
    toasts$.next([
      { id: '1', message: 'Success!', type: 'success' },
      { id: '2', message: 'Error!', type: 'error' }
    ]);
    fixture.detectChanges();

    const toastEls = fixture.nativeElement.querySelectorAll('.toast');
    expect(toastEls.length).toBe(2);
    expect(toastEls[0].textContent).toContain('Success!');
    expect(toastEls[1].textContent).toContain('Error!');
  });

  it('should render close button on each toast', () => {
    toasts$.next([{ id: '1', message: 'Test', type: 'info' }]);
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.toast__close');
    expect(closeBtn).toBeTruthy();
  });

  it('should call toastService.remove when close button clicked', () => {
    toasts$.next([{ id: 'toast-123', message: 'Test', type: 'info' }]);
    fixture.detectChanges();

    const closeBtn = fixture.nativeElement.querySelector('.toast__close');
    closeBtn.click();

    expect(toastService.remove).toHaveBeenCalledWith('toast-123');
  });

  it('should apply correct CSS class for success type', () => {
    toasts$.next([{ id: '1', message: 'Done', type: 'success' }]);
    fixture.detectChanges();

    const toastEl = fixture.nativeElement.querySelector('.toast--success');
    expect(toastEl).toBeTruthy();
  });

  it('should apply correct CSS class for error type', () => {
    toasts$.next([{ id: '1', message: 'Error', type: 'error' }]);
    fixture.detectChanges();

    const toastEl = fixture.nativeElement.querySelector('.toast--error');
    expect(toastEl).toBeTruthy();
  });

  it('should apply correct CSS class for info type', () => {
    toasts$.next([{ id: '1', message: 'Info', type: 'info' }]);
    fixture.detectChanges();

    const toastEl = fixture.nativeElement.querySelector('.toast--info');
    expect(toastEl).toBeTruthy();
  });

  it('should render no toasts when list is empty', () => {
    toasts$.next([]);
    fixture.detectChanges();

    const toastEls = fixture.nativeElement.querySelectorAll('.toast');
    expect(toastEls.length).toBe(0);
  });

  it('should have trackToast method that returns toast id', () => {
    const toast: Toast = { id: 'abc', message: 'Test', type: 'info' };
    expect(component.trackToast(0, toast)).toBe('abc');
  });
});
