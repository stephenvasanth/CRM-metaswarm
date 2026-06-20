import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  ContactService,
  Contact,
  ContactPage,
  CreateContactRequest,
} from './contact.service';

describe('ContactService', () => {
  let service: ContactService;
  let httpMock: HttpTestingController;

  const mockContact: Contact = {
    id: '1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    phone: '555-1234',
    jobTitle: 'CEO',
    tags: [],
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockPage: ContactPage = {
    content: [mockContact],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 20,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ContactService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getContacts()', () => {
    it('should GET /api/contacts with no params', () => {
      service.getContacts().subscribe((page) => expect(page).toEqual(mockPage));
      const req = httpMock.expectOne('/api/contacts');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockPage);
    });

    it('should include search param when provided', () => {
      service.getContacts({ search: 'alice' }).subscribe();
      const req = httpMock.expectOne(
        (r) => r.url === '/api/contacts' && r.params.get('search') === 'alice'
      );
      expect(req.request.params.has('page')).toBeFalse();
      req.flush(mockPage);
    });

    it('should include page and size params when provided', () => {
      service.getContacts({ page: 2, size: 10 }).subscribe();
      const req = httpMock.expectOne(
        (r) => r.params.get('page') === '2' && r.params.get('size') === '10'
      );
      expect(req.request.params.has('search')).toBeFalse();
      req.flush(mockPage);
    });

    it('should include tagId param when provided', () => {
      service.getContacts({ tagId: 'tag-abc' }).subscribe();
      const req = httpMock.expectOne(
        (r) => r.url === '/api/contacts' && r.params.get('tagId') === 'tag-abc'
      );
      req.flush(mockPage);
    });

    it('should include all params when all are provided', () => {
      service.getContacts({ search: 'bob', page: 1, size: 5, tagId: 'tag-1' }).subscribe();
      const req = httpMock.expectOne(
        (r) =>
          r.params.get('search') === 'bob' &&
          r.params.get('page') === '1' &&
          r.params.get('size') === '5' &&
          r.params.get('tagId') === 'tag-1'
      );
      req.flush(mockPage);
    });
  });

  describe('getContact()', () => {
    it('should GET /api/contacts/:id', () => {
      service.getContact('1').subscribe((c) => expect(c).toEqual(mockContact));
      const req = httpMock.expectOne('/api/contacts/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockContact);
    });
  });

  describe('createContact()', () => {
    it('should POST to /api/contacts', () => {
      const reqBody: CreateContactRequest = {
        name: 'Bob Jones',
        email: 'bob@example.com',
        tagIds: [],
      };
      service.createContact(reqBody).subscribe((c) => expect(c).toEqual(mockContact));
      const req = httpMock.expectOne('/api/contacts');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(reqBody);
      req.flush(mockContact);
    });
  });

  describe('updateContact()', () => {
    it('should PUT to /api/contacts/:id', () => {
      const reqBody: CreateContactRequest = {
        name: 'Alice Updated',
        email: 'alice@example.com',
        tagIds: ['tag-1'],
      };
      service.updateContact('1', reqBody).subscribe((c) => expect(c).toEqual(mockContact));
      const req = httpMock.expectOne('/api/contacts/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(reqBody);
      req.flush(mockContact);
    });
  });

  describe('deleteContact()', () => {
    it('should DELETE /api/contacts/:id', () => {
      service.deleteContact('1').subscribe();
      const req = httpMock.expectOne('/api/contacts/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
