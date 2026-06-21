import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { ContactFormComponent } from './contact-form.component';
import { ContactService, Contact, Company, Tag } from '../../../core/services/contact.service';
import { CompanyService } from '../../../core/services/company.service';
import { TagService, TagWithCount } from '../../../core/services/tag.service';
import { ToastService } from '../../../core/services/toast.service';

describe('ContactFormComponent', () => {
  let component: ContactFormComponent;
  let fixture: ComponentFixture<ContactFormComponent>;
  let contactServiceSpy: jasmine.SpyObj<ContactService>;
  let companyServiceSpy: jasmine.SpyObj<CompanyService>;
  let tagServiceSpy: jasmine.SpyObj<TagService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;
  let router: Router;

  const routeMock = {
    snapshot: { paramMap: convertToParamMap({}) },
  };

  const mockCompanies: Company[] = [
    { id: 'c1', name: 'Acme Corp' },
    { id: 'c2', name: 'Globex' },
  ];

  const mockAvailableTags: TagWithCount[] = [
    { id: 1, name: 'VIP', colour: '#4F46E5', contactCount: 0 },
    { id: 2, name: 'Lead', colour: '#10B981', contactCount: 0 },
  ];

  const mockContactTag: Tag = { id: 'tag-1', name: 'VIP', colour: '#4F46E5' };

  const mockContact: Contact = {
    id: '1',
    firstName: 'Alice',
    lastName: 'Smith',
    name: 'Alice Smith',
    email: 'alice@example.com',
    phone: '555-1234',
    jobTitle: 'CEO',
    company: mockCompanies[0],
    owner: { id: 'u1', name: 'Bob' },
    tags: [mockContactTag],
    createdAt: '2024-01-01T00:00:00Z',
  };

  const minimalContact: Contact = {
    id: '2',
    firstName: 'Bob',
    lastName: 'Jones',
    name: 'Bob Jones',
    email: 'bob@example.com',
    tags: [],
    createdAt: '2024-01-02T00:00:00Z',
  };

  beforeEach(async () => {
    contactServiceSpy = jasmine.createSpyObj('ContactService', [
      'getContact',
      'createContact',
      'updateContact',
    ]);
    companyServiceSpy = jasmine.createSpyObj('CompanyService', ['getCompanies']);
    tagServiceSpy = jasmine.createSpyObj('TagService', ['getTags']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['add']);

    companyServiceSpy.getCompanies.and.returnValue(of(mockCompanies));
    tagServiceSpy.getTags.and.returnValue(of(mockAvailableTags));

    await TestBed.configureTestingModule({
      imports: [ContactFormComponent],
      providers: [
        { provide: ContactService, useValue: contactServiceSpy },
        { provide: CompanyService, useValue: companyServiceSpy },
        { provide: TagService, useValue: tagServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        provideRouter([]),
        { provide: ActivatedRoute, useValue: routeMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  function buildFixture(): void {
    fixture = TestBed.createComponent(ContactFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  // ──────────────────────────────── CREATE MODE ────────────────────────────────

  describe('create mode', () => {
    beforeEach(() => {
      routeMock.snapshot.paramMap = convertToParamMap({});
      buildFixture();
    });

    it('should create', () => expect(component).toBeTruthy());

    it('should be in create mode', () => {
      expect(component.isEditMode).toBeFalse();
      expect(component.contactId).toBeNull();
    });

    it('should load companies and tags on init', () => {
      expect(companyServiceSpy.getCompanies).toHaveBeenCalled();
      expect(tagServiceSpy.getTags).toHaveBeenCalled();
      expect(component.companies).toEqual(mockCompanies);
      expect(component.availableTags).toEqual(mockAvailableTags);
    });

    it('should render "New Contact" title', () => {
      const title = fixture.nativeElement.querySelector('.contact-form-page__title');
      expect(title.textContent.trim()).toBe('New Contact');
    });

    it('should start with empty form', () => {
      expect(component.form.controls.firstName.value).toBe('');
      expect(component.form.controls.lastName.value).toBe('');
      expect(component.form.controls.email.value).toBe('');
    });

    it('should render first name required error when touched', () => {
      component.form.controls.firstName.markAsTouched();
      fixture.detectChanges();
      const err = fixture.nativeElement.querySelector('.form-field__error');
      expect(err.textContent.trim()).toBe('First name is required.');
    });

    it('should render email required error when touched empty', () => {
      component.form.controls.email.markAsTouched();
      fixture.detectChanges();
      const errors = fixture.nativeElement.querySelectorAll('.form-field__error');
      const texts = Array.from(errors).map((e: any) => e.textContent.trim());
      expect(texts).toContain('Email is required.');
    });

    it('should render email format error for invalid email', () => {
      component.form.controls.email.setValue('not-an-email');
      component.form.controls.email.markAsTouched();
      fixture.detectChanges();
      const errors = fixture.nativeElement.querySelectorAll('.form-field__error');
      const texts = Array.from(errors).map((e: any) => e.textContent.trim());
      expect(texts).toContain('Enter a valid email address.');
    });

    it('should mark all touched and not call service when form is invalid', () => {
      component.onSubmit();
      expect(contactServiceSpy.createContact).not.toHaveBeenCalled();
      expect(component.form.controls.firstName.touched).toBeTrue();
    });

    it('should create contact on valid submit', () => {
      contactServiceSpy.createContact.and.returnValue(of(mockContact));
      const navigateSpy = spyOn(router, 'navigate');
      component.form.controls.firstName.setValue('New');
      component.form.controls.lastName.setValue('Person');
      component.form.controls.email.setValue('new@example.com');
      component.onSubmit();
      expect(contactServiceSpy.createContact).toHaveBeenCalledWith(
        jasmine.objectContaining({ firstName: 'New', lastName: 'Person', email: 'new@example.com' })
      );
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Contact created', 'success');
      expect(navigateSpy).toHaveBeenCalledWith(['/contacts', mockContact.id]);
    });

    it('should show error toast and reset submitting when create fails', () => {
      contactServiceSpy.createContact.and.returnValue(throwError(() => new Error()));
      component.form.controls.firstName.setValue('New');
      component.form.controls.lastName.setValue('Person');
      component.form.controls.email.setValue('new@example.com');
      component.onSubmit();
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to save contact', 'error');
      expect(component.submitting).toBeFalse();
    });

    it('should omit empty optional fields from request', () => {
      contactServiceSpy.createContact.and.returnValue(of(mockContact));
      component.form.controls.firstName.setValue('Test');
      component.form.controls.email.setValue('test@example.com');
      component.form.controls.phone.setValue('');
      component.form.controls.jobTitle.setValue('');
      component.onSubmit();
      const req = contactServiceSpy.createContact.calls.mostRecent().args[0];
      expect(req.phone).toBeUndefined();
      expect(req.jobTitle).toBeUndefined();
      expect(req.companyId).toBeUndefined();
    });

    it('should navigate to /contacts on cancel', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.onCancel();
      expect(navigateSpy).toHaveBeenCalledWith(['/contacts']);
    });
  });

  // ──────────────────────────────── EDIT MODE ────────────────────────────────

  describe('edit mode (full contact)', () => {
    beforeEach(() => {
      routeMock.snapshot.paramMap = convertToParamMap({ id: '1' });
      contactServiceSpy.getContact.and.returnValue(of(mockContact));
      buildFixture();
    });

    it('should be in edit mode', () => {
      expect(component.isEditMode).toBeTrue();
      expect(component.contactId).toBe('1');
    });

    it('should patch form with contact data', () => {
      expect(component.form.controls.firstName.value).toBe('Alice');
      expect(component.form.controls.lastName.value).toBe('Smith');
      expect(component.form.controls.email.value).toBe('alice@example.com');
      expect(component.form.controls.phone.value).toBe('555-1234');
      expect(component.form.controls.jobTitle.value).toBe('CEO');
      expect(component.form.controls.companyId.value).toBe('c1');
      expect(component.form.controls.tagIds.value).toEqual(['tag-1']);
    });

    it('should populate companySearchControl with company name', () => {
      expect(component.companySearchControl.value).toBe('Acme Corp');
    });

    it('should render "Edit Contact" title', () => {
      const title = fixture.nativeElement.querySelector('.contact-form-page__title');
      expect(title.textContent.trim()).toBe('Edit Contact');
    });

    it('should update contact on valid submit', () => {
      contactServiceSpy.updateContact.and.returnValue(of(mockContact));
      const navigateSpy = spyOn(router, 'navigate');
      component.onSubmit();
      expect(contactServiceSpy.updateContact).toHaveBeenCalledWith(
        '1',
        jasmine.objectContaining({ firstName: 'Alice', lastName: 'Smith' })
      );
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Contact updated', 'success');
      expect(navigateSpy).toHaveBeenCalledWith(['/contacts', mockContact.id]);
    });

    it('should navigate to contact detail on cancel', () => {
      const navigateSpy = spyOn(router, 'navigate');
      component.onCancel();
      expect(navigateSpy).toHaveBeenCalledWith(['/contacts', '1']);
    });
  });

  describe('edit mode (minimal contact — no optional fields)', () => {
    beforeEach(() => {
      routeMock.snapshot.paramMap = convertToParamMap({ id: '2' });
      contactServiceSpy.getContact.and.returnValue(of(minimalContact));
      buildFixture();
    });

    it('should patch empty strings for missing optional fields', () => {
      expect(component.form.controls.phone.value).toBe('');
      expect(component.form.controls.jobTitle.value).toBe('');
      expect(component.form.controls.companyId.value).toBeNull();
      expect(component.form.controls.tagIds.value).toEqual([]);
    });

    it('should leave companySearchControl empty when no company', () => {
      expect(component.companySearchControl.value).toBe('');
    });
  });

  describe('edit mode — load error', () => {
    it('should show error toast and navigate to contacts on load failure', () => {
      routeMock.snapshot.paramMap = convertToParamMap({ id: '99' });
      contactServiceSpy.getContact.and.returnValue(throwError(() => new Error()));
      const navigateSpy = spyOn(router, 'navigate');
      buildFixture();
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to load contact', 'error');
      expect(navigateSpy).toHaveBeenCalledWith(['/contacts']);
      expect(component.loading).toBeFalse();
    });
  });

  describe('loading state in edit mode', () => {
    it('should show loading indicator while fetching contact', () => {
      routeMock.snapshot.paramMap = convertToParamMap({ id: '1' });
      const loadingSubject = new Subject<Contact>();
      contactServiceSpy.getContact.and.returnValue(loadingSubject.asObservable());
      buildFixture();
      expect(component.loading).toBeTrue();
      expect(fixture.nativeElement.querySelector('.form-loading')).toBeTruthy();
    });
  });

  // ──────────────────────────── COMPANY AUTOCOMPLETE ───────────────────────────

  describe('company autocomplete', () => {
    beforeEach(() => {
      routeMock.snapshot.paramMap = convertToParamMap({});
      buildFixture();
    });

    it('should filter companies by search term', () => {
      component.onCompanySearch('acme');
      expect(component.filteredCompanies).toEqual([mockCompanies[0]]);
      expect(component.showCompanyDropdown).toBeTrue();
    });

    it('should show all companies when search is empty', () => {
      component.onCompanySearch('');
      expect(component.filteredCompanies.length).toBe(2);
      expect(component.showCompanyDropdown).toBeTrue();
    });

    it('should clear companyId when search field is emptied', () => {
      component.form.controls.companyId.setValue('c1');
      component.onCompanySearch('');
      expect(component.form.controls.companyId.value).toBeNull();
    });

    it('should select company, update controls, and close dropdown', () => {
      component.showCompanyDropdown = true;
      component.selectCompany(mockCompanies[0]);
      expect(component.form.controls.companyId.value).toBe('c1');
      expect(component.companySearchControl.value).toBe('Acme Corp');
      expect(component.showCompanyDropdown).toBeFalse();
      expect(component.filteredCompanies.length).toBe(0);
    });

    it('should render dropdown items when visible', () => {
      component.filteredCompanies = mockCompanies;
      component.showCompanyDropdown = true;
      fixture.detectChanges();
      const items = fixture.nativeElement.querySelectorAll('.autocomplete__item');
      expect(items.length).toBe(2);
    });

    it('should show clear button when company is selected', () => {
      component.form.controls.companyId.setValue('c1');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.autocomplete__clear')).toBeTruthy();
    });

    it('should clear company and reset controls', () => {
      component.form.controls.companyId.setValue('c1');
      component.companySearchControl.setValue('Acme Corp');
      component.clearCompany();
      expect(component.form.controls.companyId.value).toBeNull();
      expect(component.companySearchControl.value).toBe('');
      expect(component.filteredCompanies.length).toBe(2);
    });

    it('should hide company dropdown after blur delay', fakeAsync(() => {
      component.showCompanyDropdown = true;
      component.onCompanyBlur();
      expect(component.showCompanyDropdown).toBeTrue();
      tick(150);
      expect(component.showCompanyDropdown).toBeFalse();
    }));

    it('should hide company dropdown immediately via hideCompanyDropdown()', () => {
      component.showCompanyDropdown = true;
      component.hideCompanyDropdown();
      expect(component.showCompanyDropdown).toBeFalse();
    });
  });

  // ─────────────────────────────── TAG MULTI-SELECT ────────────────────────────

  describe('tag multi-select', () => {
    beforeEach(() => {
      routeMock.snapshot.paramMap = convertToParamMap({});
      buildFixture();
    });

    it('should toggle tag dropdown', () => {
      expect(component.showTagDropdown).toBeFalse();
      component.toggleTagDropdown();
      expect(component.showTagDropdown).toBeTrue();
      component.toggleTagDropdown();
      expect(component.showTagDropdown).toBeFalse();
    });

    it('should render tag options when dropdown is open', () => {
      component.showTagDropdown = true;
      fixture.detectChanges();
      const options = fixture.nativeElement.querySelectorAll('.tag-select__option');
      expect(options.length).toBe(2);
    });

    it('should show empty message when no tags available', () => {
      component.availableTags = [];
      component.showTagDropdown = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.tag-select__empty')).toBeTruthy();
    });

    it('should return false for isTagSelected when tag not selected', () => {
      component.form.controls.tagIds.setValue([]);
      expect(component.isTagSelected('tag-1')).toBeFalse();
    });

    it('should return true for isTagSelected when tag is selected', () => {
      component.form.controls.tagIds.setValue(['tag-1']);
      expect(component.isTagSelected('tag-1')).toBeTrue();
    });

    it('should add tag on toggleTag for unselected tag', () => {
      component.form.controls.tagIds.setValue([]);
      component.toggleTag('tag-1');
      expect(component.form.controls.tagIds.value).toEqual(['tag-1']);
    });

    it('should remove tag on toggleTag for already selected tag', () => {
      component.form.controls.tagIds.setValue(['tag-1', 'tag-2']);
      component.toggleTag('tag-1');
      expect(component.form.controls.tagIds.value).toEqual(['tag-2']);
    });

    it('should show tag count when tags are selected', () => {
      component.form.controls.tagIds.setValue(['tag-1']);
      fixture.detectChanges();
      const trigger = fixture.nativeElement.querySelector('.tag-select__trigger');
      expect(trigger.textContent.trim()).toContain('1 tag(s) selected');
    });

    it('should show placeholder text when no tags selected', () => {
      component.form.controls.tagIds.setValue([]);
      fixture.detectChanges();
      const trigger = fixture.nativeElement.querySelector('.tag-select__trigger');
      expect(trigger.textContent.trim()).toBe('Select tags');
    });
  });

  // ──────────────────────────────── FIELD VALIDATION ───────────────────────────

  describe('isFieldInvalid()', () => {
    beforeEach(() => {
      routeMock.snapshot.paramMap = convertToParamMap({});
      buildFixture();
    });

    it('should return false for a valid untouched field', () => {
      expect(component.isFieldInvalid('firstName')).toBeFalse();
    });

    it('should return true for an invalid touched field', () => {
      component.form.controls.firstName.markAsTouched();
      expect(component.isFieldInvalid('firstName')).toBeTrue();
    });

    it('should return false for a valid touched field', () => {
      component.form.controls.firstName.setValue('Alice');
      component.form.controls.firstName.markAsTouched();
      expect(component.isFieldInvalid('firstName')).toBeFalse();
    });
  });

  // ───────────────────────────────── LIFECYCLE ─────────────────────────────────

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      routeMock.snapshot.paramMap = convertToParamMap({});
      buildFixture();
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
