import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TaskService, Task, TaskPage, CreateTaskRequest } from './task.service';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  const mockTask: Task = {
    id: 1,
    title: 'Follow up call',
    description: 'Call Alice',
    dueDate: '2026-07-01',
    completed: false,
    assigneeId: 1,
    assigneeName: 'John Assignee',
    contactId: 1,
    contactName: 'Alice Smith',
    dealId: 1,
    dealTitle: 'Big Deal',
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
  };

  const mockPage: TaskPage = {
    content: [mockTask],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 20,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET /api/tasks with default params', () => {
    service.getTasks().subscribe((page) => expect(page).toEqual(mockPage));
    const req = httpMock.expectOne('/api/tasks?page=0&size=20');
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should GET /api/tasks with completed filter', () => {
    service.getTasks(0, 20, false).subscribe((page) => expect(page).toEqual(mockPage));
    const req = httpMock.expectOne('/api/tasks?page=0&size=20&completed=false');
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should GET /api/tasks with completed=true filter', () => {
    service.getTasks(0, 20, true).subscribe((page) => expect(page).toEqual(mockPage));
    const req = httpMock.expectOne('/api/tasks?page=0&size=20&completed=true');
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('should GET /api/contacts/:id/tasks', () => {
    service.getByContact(1).subscribe((tasks) => expect(tasks).toEqual([mockTask]));
    const req = httpMock.expectOne('/api/contacts/1/tasks');
    expect(req.request.method).toBe('GET');
    req.flush([mockTask]);
  });

  it('should GET /api/deals/:id/tasks', () => {
    service.getByDeal(1).subscribe((tasks) => expect(tasks).toEqual([mockTask]));
    const req = httpMock.expectOne('/api/deals/1/tasks');
    expect(req.request.method).toBe('GET');
    req.flush([mockTask]);
  });

  it('should POST /api/tasks to create', () => {
    const req: CreateTaskRequest = { title: 'Follow up call', contactId: 1 };
    service.createTask(req).subscribe((t) => expect(t).toEqual(mockTask));
    const httpReq = httpMock.expectOne('/api/tasks');
    expect(httpReq.request.method).toBe('POST');
    expect(httpReq.request.body).toEqual(req);
    httpReq.flush(mockTask);
  });

  it('should PUT /api/tasks/:id to update', () => {
    const req: CreateTaskRequest = { title: 'Updated task' };
    service.updateTask(1, req).subscribe((t) => expect(t).toEqual(mockTask));
    const httpReq = httpMock.expectOne('/api/tasks/1');
    expect(httpReq.request.method).toBe('PUT');
    expect(httpReq.request.body).toEqual(req);
    httpReq.flush(mockTask);
  });

  it('should PATCH /api/tasks/:id/complete', () => {
    service.completeTask(1, true).subscribe((t) => expect(t).toEqual(mockTask));
    const req = httpMock.expectOne('/api/tasks/1/complete');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ completed: true });
    req.flush(mockTask);
  });

  it('should DELETE /api/tasks/:id', () => {
    service.deleteTask(1).subscribe();
    const req = httpMock.expectOne('/api/tasks/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
