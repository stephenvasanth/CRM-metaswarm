import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivityService, Activity, ActivityPage, CreateActivityRequest } from './activity.service';

describe('ActivityService', () => {
  let service: ActivityService;
  let httpMock: HttpTestingController;

  const mockActivity: Activity = {
    id: 1,
    type: 'CALL',
    subject: 'Discovery call',
    notes: 'Went well',
    occurredAt: '2026-01-01T10:00:00Z',
    contactId: 1,
    contactName: 'Alice Smith',
    dealId: 1,
    dealTitle: 'Big Deal',
    authorId: 1,
    authorName: 'John Author',
    createdAt: '2026-01-01T10:00:00Z',
  };

  const mockPage: ActivityPage = {
    content: [mockActivity],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 20,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ActivityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET /api/activities with default params', () => {
    service.getActivities().subscribe((page) => expect(page).toEqual(mockPage));
    const req = httpMock.expectOne('/api/activities?page=0&size=20');
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should GET /api/activities with custom page and size', () => {
    service.getActivities(1, 10).subscribe((page) => expect(page).toEqual(mockPage));
    const req = httpMock.expectOne('/api/activities?page=1&size=10');
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should GET /api/contacts/:id/activities', () => {
    service.getByContact(1).subscribe((activities) => expect(activities).toEqual([mockActivity]));
    const req = httpMock.expectOne('/api/contacts/1/activities');
    expect(req.request.method).toBe('GET');
    req.flush([mockActivity]);
  });

  it('should GET /api/deals/:id/activities', () => {
    service.getByDeal(1).subscribe((activities) => expect(activities).toEqual([mockActivity]));
    const req = httpMock.expectOne('/api/deals/1/activities');
    expect(req.request.method).toBe('GET');
    req.flush([mockActivity]);
  });

  it('should POST /api/activities to create', () => {
    const req: CreateActivityRequest = {
      subject: 'Discovery call',
      type: 'CALL',
      notes: 'Went well',
      contactId: 1,
    };
    service.createActivity(req).subscribe((a) => expect(a).toEqual(mockActivity));
    const httpReq = httpMock.expectOne('/api/activities');
    expect(httpReq.request.method).toBe('POST');
    expect(httpReq.request.body).toEqual(req);
    httpReq.flush(mockActivity);
  });

  it('should DELETE /api/activities/:id', () => {
    service.deleteActivity(1).subscribe();
    const req = httpMock.expectOne('/api/activities/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
