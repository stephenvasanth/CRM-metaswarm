import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TagService } from './tag.service';
import { Tag } from './contact.service';

describe('TagService', () => {
  let service: TagService;
  let httpMock: HttpTestingController;

  const mockTags: Tag[] = [
    { id: 'tag-1', name: 'VIP', colour: '#4F46E5' },
    { id: 'tag-2', name: 'Lead', colour: '#10B981' },
  ];

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
    service.getTags().subscribe((tags) => expect(tags).toEqual(mockTags));
    const req = httpMock.expectOne('/api/tags');
    expect(req.request.method).toBe('GET');
    req.flush(mockTags);
  });
});
