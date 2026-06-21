import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { DashboardService, DashboardData } from '../../core/services/dashboard.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardServiceSpy: jasmine.SpyObj<DashboardService>;

  const mockData: DashboardData = {
    openDealsCount: 3,
    pipelineValue: 15000,
    tasksDueToday: 2,
    newContactsLast7Days: 5,
    dealsByStage: [
      { stage: 'LEAD', count: 3, totalValue: 9000 },
      { stage: 'CLOSED_WON', count: 1, totalValue: 6000 },
    ],
    recentActivities: [
      {
        id: 1,
        type: 'CALL',
        subject: 'Intro call',
        contactName: 'Alice Smith',
        createdAt: '2024-06-01T10:00:00Z',
        occurredAt: '2024-06-01T10:00:00Z',
      },
    ],
    upcomingTasks: [
      {
        id: 1,
        title: 'Send proposal',
        dueDate: '2099-12-31',
        completed: false,
        createdAt: '2024-06-01T00:00:00Z',
        updatedAt: '2024-06-01T00:00:00Z',
      },
    ],
  };

  beforeEach(async () => {
    dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getDashboard']);
    dashboardServiceSpy.getDashboard.and.returnValue(of(mockData));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: DashboardService, useValue: dashboardServiceSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should call getDashboard on init', () => {
    expect(dashboardServiceSpy.getDashboard).toHaveBeenCalled();
    expect(component.data).toEqual(mockData);
    expect(component.loading).toBeFalse();
  });

  it('should render all 4 metric cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('.metric-card');
    expect(cards.length).toBe(4);
  });

  it('should display openDealsCount', () => {
    const values = fixture.nativeElement.querySelectorAll('.metric-card__value');
    const texts = Array.from(values).map((el: any) => el.textContent.trim());
    expect(texts[0]).toBe('3');
  });

  it('should display tasksDueToday', () => {
    const values = fixture.nativeElement.querySelectorAll('.metric-card__value');
    expect(values[2].textContent.trim()).toBe('2');
  });

  it('should display newContactsLast7Days', () => {
    const values = fixture.nativeElement.querySelectorAll('.metric-card__value');
    expect(values[3].textContent.trim()).toBe('5');
  });

  it('should render pipeline bars for each stage', () => {
    const bars = fixture.nativeElement.querySelectorAll('.pipeline-bar');
    expect(bars.length).toBe(2);
  });

  it('should render stage labels', () => {
    const labels = fixture.nativeElement.querySelectorAll('.pipeline-bar__label');
    expect(labels[0].textContent.trim()).toBe('Lead');
    expect(labels[1].textContent.trim()).toBe('Closed Won');
  });

  it('should render upcoming task titles', () => {
    const items = fixture.nativeElement.querySelectorAll('.task-list__item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Send proposal');
  });

  it('should render recent activity subjects', () => {
    const items = fixture.nativeElement.querySelectorAll('.activity-list__item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Intro call');
  });

  it('should render activity contact name', () => {
    const contact = fixture.nativeElement.querySelector('.activity-list__contact');
    expect(contact.textContent.trim()).toBe('Alice Smith');
  });

  it('should show loading state before data arrives', () => {
    component.loading = true;
    component.data = null;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.dashboard-loading')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.dashboard')).toBeNull();
  });

  it('should hide loading and show dashboard after data loads', () => {
    expect(fixture.nativeElement.querySelector('.dashboard')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.dashboard-loading')).toBeNull();
  });

  describe('barWidth', () => {
    it('should return 100 for max-count stage', () => {
      expect(component.barWidth({ stage: 'LEAD', count: 3, totalValue: 9000 })).toBe(100);
    });

    it('should return proportional width for other stages', () => {
      expect(component.barWidth({ stage: 'CLOSED_WON', count: 1, totalValue: 6000 })).toBe(33);
    });

    it('should return 0 when maxBarCount is 0', () => {
      component['maxBarCount'] = 0;
      expect(component.barWidth({ stage: 'LEAD', count: 5, totalValue: 1000 })).toBe(0);
    });
  });

  describe('stageLabel', () => {
    it('should return human-readable label', () => {
      expect(component.stageLabel('LEAD')).toBe('Lead');
      expect(component.stageLabel('CLOSED_WON')).toBe('Closed Won');
    });

    it('should return raw stage for unknown values', () => {
      expect(component.stageLabel('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('stageColour', () => {
    it('should return colour for known stage', () => {
      expect(component.stageColour('LEAD')).toBe('var(--color-primary)');
    });

    it('should return default for unknown stage', () => {
      expect(component.stageColour('UNKNOWN')).toBe('var(--color-primary)');
    });
  });

  describe('activityColour', () => {
    it('should return colour for CALL', () => {
      expect(component.activityColour('CALL')).toBe('var(--color-info)');
    });

    it('should return default for unknown type', () => {
      expect(component.activityColour('UNKNOWN')).toBe('var(--color-text-secondary)');
    });
  });

  describe('isOverdue', () => {
    it('should return true for past date', () => {
      expect(component.isOverdue('2000-01-01')).toBeTrue();
    });

    it('should return false for future date', () => {
      expect(component.isOverdue('2099-12-31')).toBeFalse();
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      const t = new Date();
      const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
      expect(component.isToday(today)).toBeTrue();
    });

    it('should return false for yesterday', () => {
      expect(component.isToday('2000-01-01')).toBeFalse();
    });
  });

  describe('error handling', () => {
    it('should stop loading on service error', async () => {
      dashboardServiceSpy.getDashboard.and.returnValue(throwError(() => new Error('network')));
      fixture = TestBed.createComponent(DashboardComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.loading).toBeFalse();
      expect(component.data).toBeNull();
    });
  });

  describe('empty states', () => {
    it('should show empty state for tasks when none', () => {
      component.data = { ...mockData, upcomingTasks: [] };
      fixture.detectChanges();
      const empty = fixture.nativeElement.querySelector('.tasks-widget .empty-state');
      expect(empty).toBeTruthy();
    });

    it('should show empty state for activities when none', () => {
      component.data = { ...mockData, recentActivities: [] };
      fixture.detectChanges();
      const empty = fixture.nativeElement.querySelector('.activity-feed .empty-state');
      expect(empty).toBeTruthy();
    });

    it('should not render pipeline chart when dealsByStage is empty', () => {
      component.data = { ...mockData, dealsByStage: [] };
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.pipeline-chart')).toBeNull();
    });
  });
});
