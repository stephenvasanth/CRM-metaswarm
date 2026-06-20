import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CompanyService } from './company.service';
import { Company } from './contact.service';

describe('CompanyService', () => {
  let service: CompanyService;
  let httpMock: HttpTestingController;

  const mockCompanies: Company[] = [
    { id: '1', name: 'Acme Corp' },
    { id: '2', name: 'Globex' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CompanyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET /api/companies', () => {
    service.getCompanies().subscribe((companies) => expect(companies).toEqual(mockCompanies));
    const req = httpMock.expectOne('/api/companies');
    expect(req.request.method).toBe('GET');
    req.flush(mockCompanies);
  });
});
