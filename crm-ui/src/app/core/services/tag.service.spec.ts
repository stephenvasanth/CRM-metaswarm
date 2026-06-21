import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TagService, TagWithCount, CreateTagRequest } from './tag.service';

describe('TagService', () => {
  let service: TagService;
  let httpMock: HttpTestingController;

  const mockTag: TagWithCount = { id: 1, name: 'VIP', colour: '#4F46E5', contactCount: 3 };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TagService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET /api/tags', () => {
    service.getTags().subscribe((tags) => expect(tags).toEqual([mockTag]));
    const req = httpMock.expectOne('/api/tags');
    expect(req.request.method).toBe('GET');
    req.flush([mockTag]);
  });

  it('should POST /api/tags to create a tag', () => {
    const reqBody: CreateTagRequest = { name: 'VIP', colour: '#4F46E5' };
    service.createTag(reqBody).subscribe((tag) => expect(tag).toEqual(mockTag));
    const req = httpMock.expectOne('/api/tags');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(reqBody);
    req.flush(mockTag);
  });

  it('should DELETE /api/tags/:id to delete a tag', () => {
    service.deleteTag(1).subscribe();
    const req = httpMock.expectOne('/api/tags/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
