import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { DealsBoardComponent } from './deals-board.component';
import { DealService, Deal, DealStage } from '../../../core/services/deal.service';
import { ContactService, ContactPage } from '../../../core/services/contact.service';
import { ToastService } from '../../../core/services/toast.service';

describe('DealsBoardComponent', () => {
  let component: DealsBoardComponent;
  let fixture: ComponentFixture<DealsBoardComponent>;
  let dealServiceSpy: jasmine.SpyObj<DealService>;
  let contactServiceSpy: jasmine.SpyObj<ContactService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const futureDateISO = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const pastDateISO = '2020-01-01';

  const leadDeal: Deal = {
    id: '1', title: 'Alpha', value: 500, stage: 'LEAD',
    contact: { id: 'c1', name: 'Alice' },
    closeDate: futureDateISO, createdAt: '2024-01-01T00:00:00Z',
  };

  const qualifiedDeal: Deal = {
    id: '2', title: 'Beta', value: 2000, stage: 'QUALIFIED', createdAt: '2024-01-02T00:00:00Z',
  };

  const closedLostDeal: Deal = {
    id: '3', title: 'Gamma', stage: 'CLOSED_LOST', createdAt: '2024-01-03T00:00:00Z',
  };

  const overdueDeal: Deal = {
    id: '4', title: 'Delta', value: 1500, stage: 'LEAD',
    closeDate: pastDateISO, createdAt: '2024-01-04T00:00:00Z',
  };

  const emptyPage: ContactPage = { content: [], totalElements: 0, totalPages: 0, number: 0, size: 20 };

  function makeDrop(
    deal: Deal,
    fromIndex: number,
    toIndex: number,
    sameContainer: boolean
  ): CdkDragDrop<Deal[]> {
    const container = { data: [deal] } as any;
    const previousContainer = sameContainer ? container : { data: [deal] } as any;
    return {
      item: {} as any,
      currentIndex: toIndex,
      previousIndex: fromIndex,
      container,
      previousContainer,
      isPointerOverContainer: true,
      distance: { x: 0, y: 0 },
      dropPoint: { x: 0, y: 0 },
      event: new MouseEvent('mouseup'),
    } as CdkDragDrop<Deal[]>;
  }

  beforeEach(async () => {
    dealServiceSpy = jasmine.createSpyObj('DealService', ['getDeals', 'updateDealStage']);
    contactServiceSpy = jasmine.createSpyObj('ContactService', ['getContacts']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['add']);

    dealServiceSpy.getDeals.and.returnValue(of([leadDeal, qualifiedDeal, closedLostDeal]));
    contactServiceSpy.getContacts.and.returnValue(of(emptyPage));

    await TestBed.configureTestingModule({
      imports: [DealsBoardComponent],
      providers: [
        { provide: DealService, useValue: dealServiceSpy },
        { provide: ContactService, useValue: contactServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DealsBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  it('should load deals on init', () => {
    expect(dealServiceSpy.getDeals).toHaveBeenCalled();
    expect(component.deals.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should show error toast when load fails', () => {
    dealServiceSpy.getDeals.and.returnValue(throwError(() => new Error()));
    component.loadDeals();
    expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to load deals', 'error');
    expect(component.loading).toBeFalse();
  });

  describe('loading state', () => {
    it('should show loading indicator while fetching', () => {
      const loadingSubject = new Subject<Deal[]>();
      dealServiceSpy.getDeals.and.returnValue(loadingSubject.asObservable());
      component.loadDeals();
      fixture.detectChanges();
      expect(component.loading).toBeTrue();
      expect(fixture.nativeElement.querySelector('.board__loading')).toBeTruthy();
    });
  });

  describe('dealsForStage', () => {
    it('should return deals in the given stage', () => {
      expect(component.dealsForStage('LEAD').length).toBe(1);
      expect(component.dealsForStage('QUALIFIED').length).toBe(1);
      expect(component.dealsForStage('CLOSED_LOST').length).toBe(1);
      expect(component.dealsForStage('PROPOSAL').length).toBe(0);
    });
  });

  describe('formatValue', () => {
    it('should return — when total is 0 (no value or value=0)', () => {
      expect(component.formatValue([closedLostDeal])).toBe('—');
    });

    it('should return $XK when total >= 1000', () => {
      expect(component.formatValue([qualifiedDeal])).toBe('$2K');
    });

    it('should return $X when total < 1000', () => {
      expect(component.formatValue([leadDeal])).toBe('$500');
    });
  });

  describe('formatDealValue', () => {
    it('should format a number as a dollar string', () => {
      expect(component.formatDealValue(5000)).toBe('$5,000');
    });
  });

  describe('isOverdue', () => {
    it('should return false when closeDate is undefined', () => {
      expect(component.isOverdue(undefined)).toBeFalse();
    });

    it('should return true when closeDate is in the past', () => {
      expect(component.isOverdue(pastDateISO)).toBeTrue();
    });

    it('should return false when closeDate is in the future', () => {
      expect(component.isOverdue(futureDateISO)).toBeFalse();
    });
  });

  describe('board rendering', () => {
    it('should render 6 stage columns', () => {
      const columns = fixture.nativeElement.querySelectorAll('.board__column');
      expect(columns.length).toBe(6);
    });

    it('should render deal cards in the correct column', () => {
      const cards = fixture.nativeElement.querySelectorAll('.board__card');
      expect(cards.length).toBe(3);
    });

    it('should show deal title', () => {
      const title = fixture.nativeElement.querySelector('.board__card-title');
      expect(title.textContent.trim()).toBe('Alpha');
    });

    it('should show contact name when present', () => {
      const contact = fixture.nativeElement.querySelector('.board__card-contact');
      expect(contact.textContent.trim()).toBe('Alice');
    });

    it('should show deal value when present', () => {
      const value = fixture.nativeElement.querySelector('.board__card-value');
      expect(value.textContent.trim()).toBe('$500');
    });

    it('should show close date when present', () => {
      const date = fixture.nativeElement.querySelector('.board__card-date');
      expect(date).toBeTruthy();
    });

    it('should apply closed-lost class on CLOSED_LOST cards', () => {
      const cards = fixture.nativeElement.querySelectorAll('.board__card--closed-lost');
      expect(cards.length).toBe(1);
    });

    it('should apply overdue class on cards with past close date', () => {
      dealServiceSpy.getDeals.and.returnValue(of([overdueDeal]));
      component.loadDeals();
      fixture.detectChanges();
      const overdueEl = fixture.nativeElement.querySelector('.board__card-date--overdue');
      expect(overdueEl).toBeTruthy();
    });

    it('should not show contact when absent', () => {
      dealServiceSpy.getDeals.and.returnValue(of([qualifiedDeal]));
      component.loadDeals();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.board__card-contact')).toBeNull();
    });

    it('should not show value when absent', () => {
      dealServiceSpy.getDeals.and.returnValue(of([closedLostDeal]));
      component.loadDeals();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.board__card-value')).toBeNull();
    });

    it('should not show close date when absent', () => {
      dealServiceSpy.getDeals.and.returnValue(of([qualifiedDeal]));
      component.loadDeals();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.board__card-date')).toBeNull();
    });

    it('should render drag handle on each card', () => {
      const handles = fixture.nativeElement.querySelectorAll('.board__drag-handle');
      expect(handles.length).toBe(3);
    });
  });

  describe('drawer', () => {
    it('should open drawer with deal on card click', () => {
      const card = fixture.nativeElement.querySelector('.board__card');
      card.click();
      fixture.detectChanges();
      expect(component.showDrawer).toBeTrue();
      expect(component.selectedDeal).toBe(leadDeal);
      expect(fixture.nativeElement.querySelector('app-deal-drawer')).toBeTruthy();
    });

    it('should open drawer with null on New Deal click', () => {
      const btn = fixture.nativeElement.querySelector('.btn--primary');
      btn.click();
      fixture.detectChanges();
      expect(component.showDrawer).toBeTrue();
      expect(component.selectedDeal).toBeNull();
    });

    it('should close drawer on onDrawerClosed', () => {
      component.openDrawer(leadDeal);
      component.onDrawerClosed();
      expect(component.showDrawer).toBeFalse();
      expect(component.selectedDeal).toBeNull();
    });

    it('should close drawer and reload on onDealSaved', () => {
      dealServiceSpy.getDeals.calls.reset();
      component.openDrawer(leadDeal);
      component.onDealSaved();
      expect(component.showDrawer).toBeFalse();
      expect(component.selectedDeal).toBeNull();
      expect(dealServiceSpy.getDeals).toHaveBeenCalledTimes(1);
    });
  });

  describe('stage change', () => {
    it('should call updateDealStage and reload on change', () => {
      dealServiceSpy.updateDealStage = jasmine.createSpy().and.returnValue(of(leadDeal));
      dealServiceSpy.getDeals.calls.reset();
      const event = { target: { value: 'QUALIFIED' } } as unknown as Event;
      component.onStageChange(leadDeal, event);
      expect(dealServiceSpy.updateDealStage).toHaveBeenCalledWith('1', 'QUALIFIED');
      expect(dealServiceSpy.getDeals).toHaveBeenCalledTimes(1);
    });

    it('should show error toast when stage update fails', () => {
      dealServiceSpy.updateDealStage = jasmine.createSpy().and.returnValue(throwError(() => new Error()));
      const event = { target: { value: 'QUALIFIED' } } as unknown as Event;
      component.onStageChange(leadDeal, event);
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to update stage', 'error');
    });

    it('should stop click propagation on stage select click', () => {
      const openSpy = spyOn(component, 'openDrawer');
      const select = fixture.nativeElement.querySelector('.board__card-stage');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      select.dispatchEvent(clickEvent);
      expect(openSpy).not.toHaveBeenCalled();
    });
  });

  describe('stageKeys', () => {
    it('should return all stage keys from stageKeys getter', () => {
      expect(component.stageKeys).toEqual(['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']);
    });
  });

  describe('onDrop', () => {
    it('should be a no-op when dropped in the same container', () => {
      const event = makeDrop(leadDeal, 0, 0, true);
      component.onDrop(event, 'LEAD');
      expect(dealServiceSpy.updateDealStage).not.toHaveBeenCalled();
    });

    it('should optimistically update stage and call updateDealStage on cross-column drop', () => {
      dealServiceSpy.updateDealStage = jasmine.createSpy().and.returnValue(of(leadDeal));
      const event = makeDrop(leadDeal, 0, 0, false);
      component.onDrop(event, 'QUALIFIED');
      expect(leadDeal.stage).toBe('QUALIFIED');
      expect(dealServiceSpy.updateDealStage).toHaveBeenCalledWith('1', 'QUALIFIED');
      // restore for other tests
      leadDeal.stage = 'LEAD';
    });

    it('should revert stage and show error toast on server error', () => {
      dealServiceSpy.updateDealStage = jasmine.createSpy().and.returnValue(throwError(() => new Error()));
      const event = makeDrop(leadDeal, 0, 0, false);
      component.onDrop(event, 'QUALIFIED');
      expect(leadDeal.stage).toBe('LEAD'); // reverted
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to move deal', 'error');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ on destroy', () => {
      const nextSpy = spyOn((component as any)['destroy$'], 'next');
      const completeSpy = spyOn((component as any)['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
