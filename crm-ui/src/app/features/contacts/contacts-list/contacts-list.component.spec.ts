import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { ContactsListComponent } from './contacts-list.component';
import { ContactService, Contact, ContactPage, Tag } from '../../../core/services/contact.service';
import { TagService } from '../../../core/services/tag.service';
import { ToastService } from '../../../core/services/toast.service';

describe('ContactsListComponent', () => {
  let component: ContactsListComponent;
  let fixture: ComponentFixture<ContactsListComponent>;
  let contactServiceSpy: jasmine.SpyObj<ContactService>;
  let tagServiceSpy: jasmine.SpyObj<TagService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let router: Router;

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
    createdAt: '2024-01-01T00:00:00Z',
  };

  const minimalContact: Contact = {
    id: '2',
    name: 'Bob Jones',
    email: 'bob@example.com',
    tags: [],
    createdAt: '2024-01-02T00:00:00Z',
  };

  const mockPage: ContactPage = {
    content: [fullContact, minimalContact],
    totalElements: 2,
    totalPages: 1,
    number: 0,
    size: 20,
  };

  const emptyPage: ContactPage = {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: 0,
    size: 20,
  };

  const mockTags: Tag[] = [mockTag];

  beforeEach(async () => {
    contactServiceSpy = jasmine.createSpyObj('ContactService', ['getContacts', 'deleteContact']);
    tagServiceSpy = jasmine.createSpyObj('TagService', ['getTags']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['add']);

    contactServiceSpy.getContacts.and.returnValue(of(mockPage));
    tagServiceSpy.getTags.and.returnValue(of(mockTags));

    await TestBed.configureTestingModule({
      imports: [ContactsListComponent],
      providers: [
        { provide: ContactService, useValue: contactServiceSpy },
        { provide: TagService, useValue: tagServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactsListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load contacts and tags on init', () => {
    expect(tagServiceSpy.getTags).toHaveBeenCalled();
    expect(contactServiceSpy.getContacts).toHaveBeenCalled();
    expect(component.contacts.length).toBe(2);
    expect(component.availableTags).toEqual(mockTags);
  });

  it('should set totalElements and totalPages from page response', () => {
    expect(component.totalElements).toBe(2);
    expect(component.totalPages).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should render contact rows', () => {
    const rows = fixture.nativeElement.querySelectorAll('.contacts-table__row');
    expect(rows.length).toBe(2);
  });

  it('should show company name for contacts with company', () => {
    const cells = fixture.nativeElement.querySelectorAll('tbody tr td:nth-child(2)');
    expect(cells[0].textContent.trim()).toBe('Acme Corp');
  });

  it('should show — for contacts without company', () => {
    const cells = fixture.nativeElement.querySelectorAll('tbody tr td:nth-child(2)');
    expect(cells[1].textContent.trim()).toBe('—');
  });

  it('should show phone number for contacts with phone', () => {
    const cells = fixture.nativeElement.querySelectorAll('tbody tr td:nth-child(4)');
    expect(cells[0].textContent.trim()).toBe('555-1234');
  });

  it('should show — for contacts without phone', () => {
    const cells = fixture.nativeElement.querySelectorAll('tbody tr td:nth-child(4)');
    expect(cells[1].textContent.trim()).toBe('—');
  });

  it('should show owner name for contacts with owner', () => {
    const cells = fixture.nativeElement.querySelectorAll('tbody tr td:nth-child(6)');
    expect(cells[0].textContent.trim()).toBe('Bob');
  });

  it('should show — for contacts without owner', () => {
    const cells = fixture.nativeElement.querySelectorAll('tbody tr td:nth-child(6)');
    expect(cells[1].textContent.trim()).toBe('—');
  });

  it('should render tag chips for contacts with tags', () => {
    const tagChips = fixture.nativeElement.querySelectorAll('app-tag-chip');
    expect(tagChips.length).toBe(1);
  });

  it('should render available tags in filter dropdown', () => {
    const options = fixture.nativeElement.querySelectorAll('.tag-filter option');
    expect(options.length).toBe(2); // "All tags" + 1 tag
    expect(options[1].textContent.trim()).toBe('VIP');
  });

  describe('loading state', () => {
    it('should show loading indicator while fetching', fakeAsync(() => {
      const loadingSubject = new Subject<never>();
      contactServiceSpy.getContacts.and.returnValue(loadingSubject.asObservable());
      component.loadContacts();
      fixture.detectChanges();
      expect(component.loading).toBeTrue();
      const loadingEl = fixture.nativeElement.querySelector('.contacts-page__loading');
      expect(loadingEl).toBeTruthy();
    }));
  });

  describe('empty state', () => {
    beforeEach(() => {
      contactServiceSpy.getContacts.and.returnValue(of(emptyPage));
      component.loadContacts();
      fixture.detectChanges();
    });

    it('should show empty state when no contacts', () => {
      const emptyEl = fixture.nativeElement.querySelector('.contacts-page__empty');
      expect(emptyEl).toBeTruthy();
    });

    it('should have CTA button in empty state', () => {
      const btn = fixture.nativeElement.querySelector('.empty-state .btn--primary');
      expect(btn.textContent.trim()).toBe('Add Contact');
    });
  });

  describe('search', () => {
    it('should show clear button when search has value', () => {
      component.searchControl.setValue('alice');
      fixture.detectChanges();
      const clearBtn = fixture.nativeElement.querySelector('.search-box__clear');
      expect(clearBtn).toBeTruthy();
    });

    it('should not show clear button when search is empty', () => {
      component.searchControl.setValue('');
      fixture.detectChanges();
      const clearBtn = fixture.nativeElement.querySelector('.search-box__clear');
      expect(clearBtn).toBeNull();
    });

    it('should debounce search and reload contacts', fakeAsync(() => {
      contactServiceSpy.getContacts.calls.reset();
      component.searchControl.setValue('alice');
      expect(contactServiceSpy.getContacts).not.toHaveBeenCalled();
      tick(300);
      expect(contactServiceSpy.getContacts).toHaveBeenCalledWith(
        jasmine.objectContaining({ search: 'alice' })
      );
    }));

    it('should not fire duplicate search for same value', fakeAsync(() => {
      contactServiceSpy.getContacts.calls.reset();
      component.searchControl.setValue('alice');
      component.searchControl.setValue('alice');
      tick(300);
      expect(contactServiceSpy.getContacts).toHaveBeenCalledTimes(1);
    }));

    it('should reset page to 0 on search', fakeAsync(() => {
      component.currentPage = 2;
      component.searchControl.setValue('bob');
      tick(300);
      expect(component.currentPage).toBe(0);
    }));

    it('should clear search and reload immediately', () => {
      contactServiceSpy.getContacts.calls.reset();
      component.searchControl.setValue('alice');
      contactServiceSpy.getContacts.calls.reset();
      component.clearSearch();
      expect(component.searchControl.value).toBe('');
      expect(component.currentPage).toBe(0);
      expect(contactServiceSpy.getContacts).toHaveBeenCalledTimes(1);
    });
  });

  describe('tag filter', () => {
    it('should update selectedTagId and reload contacts', () => {
      contactServiceSpy.getContacts.calls.reset();
      component.onTagFilterChange('tag-1');
      expect(component.selectedTagId).toBe('tag-1');
      expect(component.currentPage).toBe(0);
      expect(contactServiceSpy.getContacts).toHaveBeenCalledWith(
        jasmine.objectContaining({ tagId: 'tag-1' })
      );
    });

    it('should pass undefined tagId when filter cleared', () => {
      component.onTagFilterChange('');
      expect(contactServiceSpy.getContacts).toHaveBeenCalledWith(
        jasmine.objectContaining({ tagId: undefined })
      );
    });
  });

  describe('pagination', () => {
    it('should change page and reload', () => {
      contactServiceSpy.getContacts.calls.reset();
      component.onPageChange(2);
      expect(component.currentPage).toBe(2);
      expect(contactServiceSpy.getContacts).toHaveBeenCalledTimes(1);
    });

    it('should change page size, reset page, and reload', () => {
      component.currentPage = 3;
      contactServiceSpy.getContacts.calls.reset();
      component.onPageSizeChange(50);
      expect(component.pageSize).toBe(50);
      expect(component.currentPage).toBe(0);
      expect(contactServiceSpy.getContacts).toHaveBeenCalledTimes(1);
    });

    it('should disable prev button on first page', () => {
      component.currentPage = 0;
      fixture.detectChanges();
      const prevBtn = fixture.nativeElement.querySelector('[aria-label="Previous page"]');
      expect(prevBtn.disabled).toBeTrue();
    });

    it('should enable prev button beyond first page', () => {
      contactServiceSpy.getContacts.and.returnValue(of({
        ...mockPage, totalPages: 3, number: 1
      }));
      component.currentPage = 1;
      component.totalPages = 3;
      fixture.detectChanges();
      const prevBtn = fixture.nativeElement.querySelector('[aria-label="Previous page"]');
      expect(prevBtn.disabled).toBeFalse();
    });

    it('should disable next button on last page', () => {
      component.currentPage = 0;
      component.totalPages = 1;
      fixture.detectChanges();
      const nextBtn = fixture.nativeElement.querySelector('[aria-label="Next page"]');
      expect(nextBtn.disabled).toBeTrue();
    });

    it('should enable next button when more pages exist', () => {
      component.currentPage = 0;
      component.totalPages = 3;
      fixture.detectChanges();
      const nextBtn = fixture.nativeElement.querySelector('[aria-label="Next page"]');
      expect(nextBtn.disabled).toBeFalse();
    });
  });

  describe('delete flow', () => {
    it('should show confirm dialog when confirmDelete is called', () => {
      component.confirmDelete(fullContact);
      fixture.detectChanges();
      expect(component.contactToDelete).toBe(fullContact);
      expect(component.showDeleteDialog).toBeTrue();
      const dialog = fixture.nativeElement.querySelector('app-confirm-dialog');
      expect(dialog).toBeTruthy();
    });

    it('should cancel delete when onDeleteConfirmed(false)', () => {
      component.contactToDelete = fullContact;
      component.showDeleteDialog = true;
      component.onDeleteConfirmed(false);
      expect(component.showDeleteDialog).toBeFalse();
      expect(component.contactToDelete).toBeNull();
      expect(contactServiceSpy.deleteContact).not.toHaveBeenCalled();
    });

    it('should do nothing when confirmed=true but contactToDelete is null', () => {
      component.contactToDelete = null;
      component.onDeleteConfirmed(true);
      expect(contactServiceSpy.deleteContact).not.toHaveBeenCalled();
    });

    it('should delete contact, show success toast, and reload on confirm', () => {
      contactServiceSpy.deleteContact.and.returnValue(of(undefined));
      contactServiceSpy.getContacts.calls.reset();
      component.contactToDelete = fullContact;
      component.onDeleteConfirmed(true);
      expect(contactServiceSpy.deleteContact).toHaveBeenCalledWith('1');
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Contact deleted', 'success');
      expect(contactServiceSpy.getContacts).toHaveBeenCalledTimes(1);
    });

    it('should show error toast when delete fails', () => {
      contactServiceSpy.deleteContact.and.returnValue(throwError(() => new Error()));
      component.contactToDelete = fullContact;
      component.onDeleteConfirmed(true);
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to delete contact', 'error');
    });
  });

  describe('error handling', () => {
    it('should show error toast and stop loading when getContacts fails', () => {
      contactServiceSpy.getContacts.and.returnValue(throwError(() => new Error()));
      component.loadContacts();
      expect(component.loading).toBeFalse();
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to load contacts', 'error');
    });
  });

  describe('navigation', () => {
    it('should navigate to contact detail', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.navigateToDetail('42');
      expect(navigateSpy).toHaveBeenCalledWith(['/contacts', '42']);
    });

    it('should navigate to new contact form', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.navigateToCreate();
      expect(navigateSpy).toHaveBeenCalledWith(['/contacts/new']);
    });

    it('should navigate to detail when row is clicked', () => {
      const navigateSpy = spyOn(router, 'navigate');
      const row = fixture.nativeElement.querySelector('.contacts-table__row');
      row.click();
      expect(navigateSpy).toHaveBeenCalledWith(['/contacts', fullContact.id]);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const nextSpy = spyOn((component as any)['destroy$'], 'next');
      const completeSpy = spyOn((component as any)['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
