import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { LogActivityDrawerComponent } from './log-activity-drawer.component';
import { ActivityService, Activity } from '../../../core/services/activity.service';
import { ToastService } from '../../../core/services/toast.service';

describe('LogActivityDrawerComponent', () => {
  let component: LogActivityDrawerComponent;
  let fixture: ComponentFixture<LogActivityDrawerComponent>;
  let activityServiceSpy: jasmine.SpyObj<ActivityService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockActivity: Activity = {
    id: 1,
    type: 'CALL',
    subject: 'Follow up',
    occurredAt: '2024-01-01T10:00:00Z',
    createdAt: '2024-01-01T10:00:00Z',
  };

  beforeEach(async () => {
    activityServiceSpy = jasmine.createSpyObj('ActivityService', ['createActivity']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['add']);
    activityServiceSpy.createActivity.and.returnValue(of(mockActivity));

    await TestBed.configureTestingModule({
      imports: [LogActivityDrawerComponent],
      providers: [
        { provide: ActivityService, useValue: activityServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LogActivityDrawerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  describe('submit()', () => {
    it('should mark all touched and not call API when form is invalid', () => {
      component.form.controls.subject.setValue('');
      component.submit();
      expect(activityServiceSpy.createActivity).not.toHaveBeenCalled();
      expect(component.form.controls.subject.touched).toBeTrue();
    });

    it('should call createActivity with ISO occurredAt and emit activityLogged on success', () => {
      const loggedSpy = jasmine.createSpy('activityLogged');
      component.activityLogged.subscribe(loggedSpy);

      component.form.setValue({ subject: 'Test call', type: 'CALL', notes: '', occurredAt: '2024-06-21T10:30' });
      component.submit();

      const req = activityServiceSpy.createActivity.calls.mostRecent().args[0];
      expect(req.subject).toBe('Test call');
      expect(req.type).toBe('CALL');
      expect(req.occurredAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(loggedSpy).toHaveBeenCalledWith(mockActivity);
      expect(component.submitting).toBeFalse();
    });

    it('should omit notes when empty', () => {
      component.form.setValue({ subject: 'Test', type: 'EMAIL', notes: '', occurredAt: '' });
      component.submit();
      const req = activityServiceSpy.createActivity.calls.mostRecent().args[0];
      expect(req.notes).toBeUndefined();
    });

    it('should omit occurredAt when empty', () => {
      component.form.setValue({ subject: 'Test', type: 'NOTE', notes: '', occurredAt: '' });
      component.submit();
      const req = activityServiceSpy.createActivity.calls.mostRecent().args[0];
      expect(req.occurredAt).toBeUndefined();
    });

    it('should include contactId and dealId when set', () => {
      component.contactId = 5;
      component.dealId = 10;
      component.form.setValue({ subject: 'Test', type: 'MEETING', notes: '', occurredAt: '' });
      component.submit();
      const req = activityServiceSpy.createActivity.calls.mostRecent().args[0];
      expect(req.contactId).toBe(5);
      expect(req.dealId).toBe(10);
    });

    it('should show error toast and reset submitting on failure', () => {
      activityServiceSpy.createActivity.and.returnValue(throwError(() => new Error('500')));
      component.form.setValue({ subject: 'Test', type: 'CALL', notes: '', occurredAt: '' });
      component.submit();
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to log activity', 'error');
      expect(component.submitting).toBeFalse();
    });

    it('should include notes when provided', () => {
      component.form.setValue({ subject: 'Test', type: 'CALL', notes: 'Some notes', occurredAt: '' });
      component.submit();
      const req = activityServiceSpy.createActivity.calls.mostRecent().args[0];
      expect(req.notes).toBe('Some notes');
    });
  });

  describe('closed event', () => {
    it('should emit closed when overlay is clicked', () => {
      const closedSpy = jasmine.createSpy('closed');
      component.closed.subscribe(closedSpy);
      fixture.detectChanges();
      const overlay = fixture.nativeElement.querySelector('.drawer-overlay');
      overlay.click();
      expect(closedSpy).toHaveBeenCalled();
    });
  });

  describe('template', () => {
    it('should render subject field', () => {
      expect(fixture.nativeElement.querySelector('#activity-subject')).toBeTruthy();
    });

    it('should render type select', () => {
      expect(fixture.nativeElement.querySelector('#activity-type')).toBeTruthy();
    });

    it('should show Saving… while submitting', () => {
      component.submitting = true;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(btn.textContent.trim()).toBe('Saving…');
    });

    it('should disable submit button while submitting', () => {
      component.submitting = true;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(btn.disabled).toBeTrue();
    });
  });
});
