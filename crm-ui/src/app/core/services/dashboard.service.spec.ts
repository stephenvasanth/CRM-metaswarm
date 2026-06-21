import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { DashboardService, DashboardData } from './dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let http: HttpTestingController;

  const mockDashboard: DashboardData = {
    openDealsCount: 3,
    pipelineValue: 15000,
    tasksDueToday: 2,
    newContactsLast7Days: 5,
    dealsByStage: [{ stage: 'LEAD', count: 3, totalValue: 15000 }],
    recentActivities: [],
    upcomingTasks: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DashboardService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should be created', () => expect(service).toBeTruthy());

  it('should GET /api/dashboard', () => {
    service.getDashboard().subscribe((data) => {
      expect(data.openDealsCount).toBe(3);
      expect(data.dealsByStage.length).toBe(1);
    });
    const req = http.expectOne('/api/dashboard');
    expect(req.request.method).toBe('GET');
    req.flush(mockDashboard);
  });
});
