import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ActivitiesFeedComponent } from './activities-feed.component';
import { ActivityService, Activity, ActivityPage } from '../../../core/services/activity.service';
import { ToastService } from '../../../core/services/toast.service';

describe('ActivitiesFeedComponent', () => {
  let component: ActivitiesFeedComponent;
  let fixture: ComponentFixture<ActivitiesFeedComponent>;
  let activityServiceSpy: jasmine.SpyObj<ActivityService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockActivity: Activity = {
    id: 1,
    type: 'CALL',
    subject: 'Follow-up call',
    occurredAt: '2024-01-01T10:00:00Z',
    createdAt: '2024-01-01T10:00:00Z',
  };

  const mockPage: ActivityPage = {
    content: [mockActivity],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 20,
  };

  function setup(inputs: { contactId?: number; dealId?: number } = {}): void {
    activityServiceSpy = jasmine.createSpyObj('ActivityService', [
      'getActivities',
      'getByContact',
      'getByDeal',
      'createActivity',
      'deleteActivity',
    ]);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['add']);

    activityServiceSpy.getActivities.and.returnValue(of(mockPage));
    activityServiceSpy.getByContact.and.returnValue(of([mockActivity]));
    activityServiceSpy.getByDeal.and.returnValue(of([mockActivity]));

    TestBed.configureTestingModule({
      imports: [ActivitiesFeedComponent],
      providers: [
        { provide: ActivityService, useValue: activityServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivitiesFeedComponent);
    component = fixture.componentInstance;
    if (inputs.contactId !== undefined) component.contactId = inputs.contactId;
    if (inputs.dealId !== undefined) component.dealId = inputs.dealId;
    fixture.detectChanges();
  }

  describe('standalone route (no contactId/dealId)', () => {
    beforeEach(() => setup());

    it('should create', () => expect(component).toBeTruthy());

    it('should call getActivities() when no contactId or dealId', () => {
      expect(activityServiceSpy.getActivities).toHaveBeenCalled();
      expect(activityServiceSpy.getByContact).not.toHaveBeenCalled();
      expect(component.activities).toEqual([mockActivity]);
      expect(component.loading).toBeFalse();
    });

    it('should show error toast and clear loading on getActivities error', () => {
      activityServiceSpy.getActivities.and.returnValue(throwError(() => new Error('500')));
      component.loadActivities();
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to load activities', 'error');
      expect(component.loading).toBeFalse();
    });

    it('should show empty state when no activities', () => {
      activityServiceSpy.getActivities.and.returnValue(of({ ...mockPage, content: [] }));
      component.loadActivities();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.activities-feed__empty')).toBeTruthy();
    });

    it('should show loading indicator', () => {
      component.loading = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.activities-feed__loading')).toBeTruthy();
    });
  });

  describe('with contactId', () => {
    beforeEach(() => setup({ contactId: 10 }));

    it('should call getByContact() when contactId is set', () => {
      expect(activityServiceSpy.getByContact).toHaveBeenCalledWith(10);
      expect(activityServiceSpy.getActivities).not.toHaveBeenCalled();
    });

    it('should show error toast on getByContact error', () => {
      activityServiceSpy.getByContact.and.returnValue(throwError(() => new Error('500')));
      component.loadActivities();
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to load activities', 'error');
    });
  });

  describe('with dealId', () => {
    beforeEach(() => setup({ dealId: 5 }));

    it('should call getByDeal() when dealId is set', () => {
      expect(activityServiceSpy.getByDeal).toHaveBeenCalledWith(5);
      expect(activityServiceSpy.getActivities).not.toHaveBeenCalled();
    });
  });

  describe('openDrawer / closeDrawer', () => {
    beforeEach(() => setup());

    it('should set showDrawer to true on openDrawer()', () => {
      expect(component.showDrawer).toBeFalse();
      component.openDrawer();
      expect(component.showDrawer).toBeTrue();
    });

    it('should set showDrawer to false on closeDrawer()', () => {
      component.showDrawer = true;
      component.closeDrawer();
      expect(component.showDrawer).toBeFalse();
    });
  });

  describe('onActivityLogged()', () => {
    beforeEach(() => setup());

    it('should prepend activity to list and close drawer', () => {
      component.activities = [];
      component.showDrawer = true;
      component.onActivityLogged(mockActivity);
      expect(component.activities[0]).toBe(mockActivity);
      expect(component.showDrawer).toBeFalse();
    });
  });
});
