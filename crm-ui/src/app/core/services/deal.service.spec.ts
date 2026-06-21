import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DealService, Deal, DealStage } from './deal.service';

const mockDeal: Deal = {
  id: '1',
  title: 'Big Deal',
  value: 5000,
  stage: 'LEAD',
  createdAt: '2024-01-01T00:00:00Z',
};

describe('DealService', () => {
  let service: DealService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DealService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should get all deals', () => {
    service.getDeals().subscribe(deals => expect(deals).toEqual([mockDeal]));
    const req = httpMock.expectOne('/api/deals');
    expect(req.request.method).toBe('GET');
    req.flush([mockDeal]);
  });

  it('should get a deal by id', () => {
    service.getDeal('1').subscribe(deal => expect(deal).toEqual(mockDeal));
    const req = httpMock.expectOne('/api/deals/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockDeal);
  });

  it('should create a deal', () => {
    const body = { title: 'Big Deal', stage: 'LEAD' as DealStage };
    service.createDeal(body).subscribe(deal => expect(deal).toEqual(mockDeal));
    const req = httpMock.expectOne('/api/deals');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(mockDeal);
  });

  it('should update a deal', () => {
    const body = { title: 'Updated', stage: 'QUALIFIED' as DealStage };
    service.updateDeal('1', body).subscribe(deal => expect(deal).toEqual(mockDeal));
    const req = httpMock.expectOne('/api/deals/1');
    expect(req.request.method).toBe('PUT');
    req.flush(mockDeal);
  });

  it('should update a deal stage', () => {
    service.updateDealStage('1', 'QUALIFIED').subscribe(deal => expect(deal).toEqual(mockDeal));
    const req = httpMock.expectOne('/api/deals/1/stage');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ stage: 'QUALIFIED' });
    req.flush(mockDeal);
  });

  it('should delete a deal', () => {
    service.deleteDeal('1').subscribe();
    const req = httpMock.expectOne('/api/deals/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
