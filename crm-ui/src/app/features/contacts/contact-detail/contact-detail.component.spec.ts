import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { ContactDetailComponent } from './contact-detail.component';
import { ContactService, Contact, Tag } from '../../../core/services/contact.service';
import { ToastService } from '../../../core/services/toast.service';

describe('ContactDetailComponent', () => {
  let component: ContactDetailComponent;
  let fixture: ComponentFixture<ContactDetailComponent>;
  let contactServiceSpy: jasmine.SpyObj<ContactService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let router: Router;

  const routeMock = {
    snapshot: { paramMap: convertToParamMap({ id: '1' }) },
  };

  const mockTag: Tag = { id: 'tag-1', name: 'VIP', colour: '#4F46E5' };

  const fullContact: Contact = {
    id: '1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    phone: '555-1234',
    jobTitle: 'CEO',
    company: { id: 'c1', name: 'Acme Corp' },
    owner: { id: 'u1', name: 'Bob', email: 'bob@example.com' },
    tags: [mockTag],
    createdAt: '2024-06-01T00:00:00Z',
  };

  const minimalContact: Contact = {
    id: '2',
    name: 'Bob Jones',
    email: 'bob@example.com',
    tags: [],
    createdAt: '2024-06-02T00:00:00Z',
  };

  beforeEach(async () => {
    contactServiceSpy = jasmine.createSpyObj('ContactService', ['getContact', 'deleteContact']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['add']);

    await TestBed.configureTestingModule({
      imports: [ContactDetailComponent],
      providers: [
        { provide: ContactService, useValue: contactServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        provideRouter([]),
        { provide: ActivatedRoute, useValue: routeMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  function createFixture(contact: Contact): void {
    contactServiceSpy.getContact.and.returnValue(of(contact));
    fixture = TestBed.createComponent(ContactDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('full contact (id = 1)', () => {
    beforeEach(() => {
      routeMock.snapshot.paramMap = convertToParamMap({ id: '1' });
      createFixture(fullContact);
    });

    it('should create', () => expect(component).toBeTruthy());

    it('should load contact on init', () => {
      expect(contactServiceSpy.getContact).toHaveBeenCalledWith('1');
      expect(component.contact).toEqual(fullContact);
      expect(component.loading).toBeFalse();
    });

    it('should render contact name', () => {
      const nameEl = fixture.nativeElement.querySelector('.contact-hero__name');
      expect(nameEl.textContent.trim()).toBe('Alice Smith');
    });

    it('should render job title when present', () => {
      const titleEl = fixture.nativeElement.querySelector('.contact-hero__title');
      expect(titleEl.textContent.trim()).toBe('CEO');
    });

    it('should render email link', () => {
      const emailLink = fixture.nativeElement.querySelector('a[href^="mailto:"]');
      expect(emailLink).toBeTruthy();
      expect(emailLink.textContent.trim()).toBe('alice@example.com');
    });

    it('should render phone link when present', () => {
      const phoneLink = fixture.nativeElement.querySelector('a[href^="tel:"]');
      expect(phoneLink).toBeTruthy();
      expect(phoneLink.textContent.trim()).toBe('555-1234');
    });

    it('should render company name when present', () => {
      const values = fixture.nativeElement.querySelectorAll('.info-grid__value');
      const texts = Array.from(values).map((el: any) => el.textContent.trim());
      expect(texts).toContain('Acme Corp');
    });

    it('should render owner name when present', () => {
      const values = fixture.nativeElement.querySelectorAll('.info-grid__value');
      const texts = Array.from(values).map((el: any) => el.textContent.trim());
      expect(texts).toContain('Bob');
    });

    it('should render tag chips when contact has tags', () => {
      const chips = fixture.nativeElement.querySelectorAll('app-tag-chip');
      expect(chips.length).toBe(1);
    });

    it('should format creation date correctly', () => {
      const result = component.formatDate('2024-06-01T00:00:00Z');
      expect(result).toContain('2024');
    });
  });

  describe('minimal contact (no optional fields)', () => {
    beforeEach(() => {
      routeMock.snapshot.paramMap = convertToParamMap({ id: '2' });
      createFixture(minimalContact);
    });

    it('should not render job title when absent', () => {
      const titleEl = fixture.nativeElement.querySelector('.contact-hero__title');
      expect(titleEl).toBeNull();
    });

    it('should not render phone link when absent', () => {
      const phoneLink = fixture.nativeElement.querySelector('a[href^="tel:"]');
      expect(phoneLink).toBeNull();
    });

    it('should not render company row when absent', () => {
      const labels = fixture.nativeElement.querySelectorAll('.info-grid__label');
      const texts = Array.from(labels).map((el: any) => el.textContent.trim());
      expect(texts).not.toContain('Company');
    });

    it('should not render owner row when absent', () => {
      const labels = fixture.nativeElement.querySelectorAll('.info-grid__label');
      const texts = Array.from(labels).map((el: any) => el.textContent.trim());
      expect(texts).not.toContain('Owner');
    });

    it('should not render tags section when contact has no tags', () => {
      const tagsSection = fixture.nativeElement.querySelector('.contact-tags');
      expect(tagsSection).toBeNull();
    });
  });

  describe('loading state', () => {
    it('should show loading indicator while fetching', () => {
      routeMock.snapshot.paramMap = convertToParamMap({ id: '1' });
      const loadingSubject = new Subject<Contact>();
      contactServiceSpy.getContact.and.returnValue(loadingSubject.asObservable());
      fixture = TestBed.createComponent(ContactDetailComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.loading).toBeTrue();
      expect(fixture.nativeElement.querySelector('.detail-loading')).toBeTruthy();
    });
  });

  describe('load error', () => {
    it('should show error toast and navigate to /contacts on failure', () => {
      routeMock.snapshot.paramMap = convertToParamMap({ id: '1' });
      contactServiceSpy.getContact.and.returnValue(throwError(() => new Error()));
      const navigateSpy = spyOn(router, 'navigate');
      fixture = TestBed.createComponent(ContactDetailComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to load contact', 'error');
      expect(navigateSpy).toHaveBeenCalledWith(['/contacts']);
      expect(component.loading).toBeFalse();
    });
  });

  describe('tabs', () => {
    beforeEach(() => {
      routeMock.snapshot.paramMap = convertToParamMap({ id: '1' });
      createFixture(fullContact);
    });

    it('should default to activities tab', () => {
      expect(component.activeTab).toBe('activities');
    });

    it('should switch to tasks tab', () => {
      component.setTab('tasks');
      fixture.detectChanges();
      expect(component.activeTab).toBe('tasks');
    });

    it('should render activities placeholder on activities tab', () => {
      component.activeTab = 'activities';
      fixture.detectChanges();
      const placeholder = fixture.nativeElement.querySelector('.detail-tabs__placeholder');
      expect(placeholder.textContent).toContain('WU-11');
    });

    it('should render tasks placeholder on tasks tab', () => {
      component.setTab('tasks');
      fixture.detectChanges();
      const placeholder = fixture.nativeElement.querySelector('.detail-tabs__placeholder');
      expect(placeholder.textContent).toContain('WU-12');
    });
  });

  describe('delete flow', () => {
    beforeEach(() => {
      routeMock.snapshot.paramMap = convertToParamMap({ id: '1' });
      createFixture(fullContact);
    });

    it('should open delete dialog', () => {
      component.openDeleteDialog();
      fixture.detectChanges();
      expect(component.showDeleteDialog).toBeTrue();
      expect(fixture.nativeElement.querySelector('app-confirm-dialog')).toBeTruthy();
    });

    it('should close dialog without deleting on cancel', () => {
      component.showDeleteDialog = true;
      component.onDeleteConfirmed(false);
      expect(component.showDeleteDialog).toBeFalse();
      expect(contactServiceSpy.deleteContact).not.toHaveBeenCalled();
    });

    it('should not delete when contact is null', () => {
      component.contact = null;
      component.onDeleteConfirmed(true);
      expect(contactServiceSpy.deleteContact).not.toHaveBeenCalled();
    });

    it('should delete, show success toast, and navigate to list', () => {
      contactServiceSpy.deleteContact.and.returnValue(of(undefined));
      const navigateSpy = spyOn(router, 'navigate');
      component.onDeleteConfirmed(true);
      expect(contactServiceSpy.deleteContact).toHaveBeenCalledWith('1');
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Contact deleted', 'success');
      expect(navigateSpy).toHaveBeenCalledWith(['/contacts']);
    });

    it('should show error toast when delete fails', () => {
      contactServiceSpy.deleteContact.and.returnValue(throwError(() => new Error()));
      component.onDeleteConfirmed(true);
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to delete contact', 'error');
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      routeMock.snapshot.paramMap = convertToParamMap({ id: '1' });
      createFixture(fullContact);
    });

    it('should complete destroy$ on destroy', () => {
      const nextSpy = spyOn((component as any)['destroy$'], 'next');
      const completeSpy = spyOn((component as any)['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
