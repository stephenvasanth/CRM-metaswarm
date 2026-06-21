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

  // Raw backend response shape
  const rawContact = {
    id: 1,
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    phone: '555-1234',
    jobTitle: 'CEO',
    tags: [],
    createdAt: '2024-01-01T00:00:00Z',
  };

  // Mapped frontend Contact shape
  const mockContact: Contact = {
    id: '1',
    firstName: 'Alice',
    lastName: 'Smith',
    name: 'Alice Smith',
    email: 'alice@example.com',
    phone: '555-1234',
    jobTitle: 'CEO',
    tags: [],
    createdAt: '2024-01-01T00:00:00Z',
  };

  const rawPage = {
    content: [rawContact],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 20,
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
    it('should GET /api/contacts with no params and map response', () => {
      service.getContacts().subscribe((page) => expect(page).toEqual(mockPage));
      const req = httpMock.expectOne('/api/contacts');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(rawPage);
    });

    it('should include search param when provided', () => {
      service.getContacts({ search: 'alice' }).subscribe();
      const req = httpMock.expectOne(
        (r) => r.url === '/api/contacts' && r.params.get('search') === 'alice'
      );
      expect(req.request.params.has('page')).toBeFalse();
      req.flush(rawPage);
    });

    it('should include page and size params when provided', () => {
      service.getContacts({ page: 2, size: 10 }).subscribe();
      const req = httpMock.expectOne(
        (r) => r.params.get('page') === '2' && r.params.get('size') === '10'
      );
      expect(req.request.params.has('search')).toBeFalse();
      req.flush(rawPage);
    });

    it('should include tagId param when provided', () => {
      service.getContacts({ tagId: 'tag-abc' }).subscribe();
      const req = httpMock.expectOne(
        (r) => r.url === '/api/contacts' && r.params.get('tagId') === 'tag-abc'
      );
      req.flush(rawPage);
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
      req.flush(rawPage);
    });

    it('should compute name from firstName and lastName', () => {
      let result: ContactPage | undefined;
      service.getContacts().subscribe((p) => (result = p));
      const req = httpMock.expectOne('/api/contacts');
      req.flush(rawPage);
      expect(result!.content[0].name).toBe('Alice Smith');
    });
  });

  describe('getContact()', () => {
    it('should GET /api/contacts/:id and map response', () => {
      service.getContact('1').subscribe((c) => expect(c).toEqual(mockContact));
      const req = httpMock.expectOne('/api/contacts/1');
      expect(req.request.method).toBe('GET');
      req.flush(rawContact);
    });

    it('should build nested company from flat companyId/companyName', () => {
      const rawWithCompany = { ...rawContact, companyId: 5, companyName: 'Acme Corp' };
      let result: Contact | undefined;
      service.getContact('1').subscribe((c) => (result = c));
      const req = httpMock.expectOne('/api/contacts/1');
      req.flush(rawWithCompany);
      expect(result!.company).toEqual({ id: '5', name: 'Acme Corp' });
      expect(result!.companyId).toBe(5);
    });

    it('should build nested owner from flat ownerId/ownerName', () => {
      const rawWithOwner = { ...rawContact, ownerId: 2, ownerName: 'Bob Jones' };
      let result: Contact | undefined;
      service.getContact('1').subscribe((c) => (result = c));
      const req = httpMock.expectOne('/api/contacts/1');
      req.flush(rawWithOwner);
      expect(result!.owner).toEqual({ id: '2', name: 'Bob Jones' });
    });

    it('should convert tag ids to strings', () => {
      const rawWithTags = { ...rawContact, tags: [{ id: 10, name: 'VIP', colour: '#4F46E5' }] };
      let result: Contact | undefined;
      service.getContact('1').subscribe((c) => (result = c));
      const req = httpMock.expectOne('/api/contacts/1');
      req.flush(rawWithTags);
      expect(result!.tags[0].id).toBe('10');
    });

    it('should not add company when companyId is null', () => {
      const rawNoCompany = { ...rawContact, companyId: null };
      let result: Contact | undefined;
      service.getContact('1').subscribe((c) => (result = c));
      const req = httpMock.expectOne('/api/contacts/1');
      req.flush(rawNoCompany);
      expect(result!.company).toBeUndefined();
    });
  });

  describe('createContact()', () => {
    it('should POST to /api/contacts with firstName/lastName and number tagIds', () => {
      const reqBody: CreateContactRequest = {
        firstName: 'Bob',
        lastName: 'Jones',
        email: 'bob@example.com',
        tagIds: [],
      };
      service.createContact(reqBody).subscribe((c) => expect(c).toEqual(mockContact));
      const req = httpMock.expectOne('/api/contacts');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(reqBody);
      req.flush(rawContact);
    });

    it('should include companyId as number', () => {
      const reqBody: CreateContactRequest = {
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        companyId: 5,
        tagIds: [1, 2],
      };
      service.createContact(reqBody).subscribe();
      const req = httpMock.expectOne('/api/contacts');
      expect(req.request.body.companyId).toBe(5);
      expect(req.request.body.tagIds).toEqual([1, 2]);
      req.flush(rawContact);
    });
  });

  describe('updateContact()', () => {
    it('should PUT to /api/contacts/:id with firstName/lastName', () => {
      const reqBody: CreateContactRequest = {
        firstName: 'Alice',
        lastName: 'Updated',
        email: 'alice@example.com',
        tagIds: [1],
      };
      service.updateContact('1', reqBody).subscribe((c) => expect(c).toEqual(mockContact));
      const req = httpMock.expectOne('/api/contacts/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(reqBody);
      req.flush(rawContact);
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
