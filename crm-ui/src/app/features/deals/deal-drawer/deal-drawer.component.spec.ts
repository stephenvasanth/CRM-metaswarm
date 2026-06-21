import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { DealDrawerComponent } from './deal-drawer.component';
import { DealService, Deal } from '../../../core/services/deal.service';
import { ContactService, ContactPage } from '../../../core/services/contact.service';
import { ToastService } from '../../../core/services/toast.service';

const mockDeal: Deal = {
  id: '1',
  title: 'Big Deal',
  value: 5000,
  stage: 'LEAD',
  closeDate: '2025-12-31',
  contact: { id: 'c1', name: 'Alice' },
  notes: 'Important deal',
  createdAt: '2024-01-01T00:00:00Z',
};

const minimalDeal: Deal = {
  id: '2', title: 'Small Deal', stage: 'QUALIFIED', createdAt: '2024-01-02T00:00:00Z',
};

const mockContactPage: ContactPage = {
  content: [{ id: 'c1', firstName: 'Alice', lastName: '', name: 'Alice', email: 'alice@example.com', tags: [], createdAt: '2024-01-01T00:00:00Z' }],
  totalElements: 1, totalPages: 1, number: 0, size: 20,
};

describe('DealDrawerComponent', () => {
  let component: DealDrawerComponent;
  let fixture: ComponentFixture<DealDrawerComponent>;
  let dealServiceSpy: jasmine.SpyObj<DealService>;
  let contactServiceSpy: jasmine.SpyObj<ContactService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    dealServiceSpy = jasmine.createSpyObj('DealService', ['createDeal', 'updateDeal', 'deleteDeal']);
    contactServiceSpy = jasmine.createSpyObj('ContactService', ['getContacts']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['add']);

    contactServiceSpy.getContacts.and.returnValue(of(mockContactPage));

    await TestBed.configureTestingModule({
      imports: [DealDrawerComponent],
      providers: [
        { provide: DealService, useValue: dealServiceSpy },
        { provide: ContactService, useValue: contactServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();
  });

  function buildFixture(deal: Deal | null = null): void {
    fixture = TestBed.createComponent(DealDrawerComponent);
    component = fixture.componentInstance;
    component.deal = deal;
    fixture.detectChanges();
  }

  describe('create mode', () => {
    beforeEach(() => buildFixture(null));

    it('should create', () => expect(component).toBeTruthy());

    it('should be in create mode', () => {
      expect(component.isEditMode).toBeFalse();
    });

    it('should show "New Deal" title', () => {
      const title = fixture.nativeElement.querySelector('.drawer__title');
      expect(title.textContent.trim()).toBe('New Deal');
    });

    it('should not show delete button in create mode', () => {
      expect(fixture.nativeElement.querySelector('.btn--danger')).toBeNull();
    });

    it('should have empty form fields', () => {
      expect(component.form.get('title')!.value).toBe('');
      expect(component.form.get('value')!.value).toBeNull();
    });
  });

  describe('edit mode — full deal', () => {
    beforeEach(() => buildFixture(mockDeal));

    it('should be in edit mode', () => {
      expect(component.isEditMode).toBeTrue();
    });

    it('should show "Edit Deal" title', () => {
      const title = fixture.nativeElement.querySelector('.drawer__title');
      expect(title.textContent.trim()).toBe('Edit Deal');
    });

    it('should pre-fill form with deal data', () => {
      expect(component.form.get('title')!.value).toBe('Big Deal');
      expect(component.form.get('value')!.value).toBe(5000);
      expect(component.form.get('stage')!.value).toBe('LEAD');
      expect(component.form.get('closeDate')!.value).toBe('2025-12-31');
      expect(component.form.get('notes')!.value).toBe('Important deal');
    });

    it('should pre-fill contact search when deal has contact', () => {
      expect(component.selectedContactId).toBe('c1');
      expect(component.contactSearchControl.value).toBe('Alice');
    });

    it('should show delete button in edit mode', () => {
      expect(fixture.nativeElement.querySelector('.btn--danger')).toBeTruthy();
    });

    it('should show "Save" on submit button', () => {
      const submitBtn = fixture.nativeElement.querySelector('.btn--primary');
      expect(submitBtn.textContent.trim()).toBe('Save');
    });
  });

  describe('edit mode — minimal deal (no optional fields)', () => {
    beforeEach(() => buildFixture(minimalDeal));

    it('should not pre-fill contact when deal has no contact', () => {
      expect(component.selectedContactId).toBeNull();
      expect(component.contactSearchControl.value).toBe('');
    });

    it('should have empty value field when deal has no value', () => {
      expect(component.form.get('value')!.value).toBeNull();
    });
  });

  describe('form validation', () => {
    beforeEach(() => buildFixture(null));

    it('should mark all fields touched and not submit when title is empty', () => {
      component.onSubmit();
      expect(component.form.get('title')!.touched).toBeTrue();
      expect(dealServiceSpy.createDeal).not.toHaveBeenCalled();
    });

    it('should show title error message when title is invalid and touched', () => {
      component.form.get('title')!.markAsTouched();
      fixture.detectChanges();
      const error = fixture.nativeElement.querySelector('.form-field__error');
      expect(error).toBeTruthy();
    });

    it('isFieldInvalid should return true when invalid and touched', () => {
      component.form.get('title')!.markAsTouched();
      expect(component.isFieldInvalid('title')).toBeTrue();
    });

    it('isFieldInvalid should return false when untouched', () => {
      expect(component.isFieldInvalid('title')).toBeFalse();
    });

    it('isFieldInvalid should return false for unknown field', () => {
      expect(component.isFieldInvalid('nonexistent')).toBeFalse();
    });
  });

  describe('create deal submission', () => {
    beforeEach(() => buildFixture(null));

    it('should create deal with full data and emit saved', () => {
      dealServiceSpy.createDeal.and.returnValue(of(mockDeal));
      const savedSpy = jasmine.createSpy();
      component.saved.subscribe(savedSpy);

      component.form.patchValue({ title: 'New Deal', value: 1000, stage: 'LEAD', closeDate: '2025-12-31', notes: 'notes' });
      component.selectedContactId = 'c1';
      component.onSubmit();

      expect(dealServiceSpy.createDeal).toHaveBeenCalledWith({
        title: 'New Deal',
        value: 1000,
        stage: 'LEAD',
        closeDate: '2025-12-31',
        contactId: 'c1',
        notes: 'notes',
      });
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Deal created', 'success');
      expect(savedSpy).toHaveBeenCalled();
    });

    it('should create deal with minimal data (no optional fields)', () => {
      dealServiceSpy.createDeal.and.returnValue(of(minimalDeal));
      component.form.patchValue({ title: 'Min Deal', stage: 'LEAD' });
      component.onSubmit();

      expect(dealServiceSpy.createDeal).toHaveBeenCalledWith({
        title: 'Min Deal',
        value: undefined,
        stage: 'LEAD',
        closeDate: undefined,
        contactId: undefined,
        notes: undefined,
      });
    });

    it('should show error toast when create fails', () => {
      dealServiceSpy.createDeal.and.returnValue(throwError(() => new Error()));
      component.form.patchValue({ title: 'Deal', stage: 'LEAD' });
      component.onSubmit();
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to create deal', 'error');
    });
  });

  describe('update deal submission', () => {
    beforeEach(() => buildFixture(mockDeal));

    it('should update deal and emit saved', () => {
      dealServiceSpy.updateDeal.and.returnValue(of(mockDeal));
      const savedSpy = jasmine.createSpy();
      component.saved.subscribe(savedSpy);
      component.onSubmit();

      expect(dealServiceSpy.updateDeal).toHaveBeenCalledWith('1', jasmine.objectContaining({ title: 'Big Deal' }));
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Deal updated', 'success');
      expect(savedSpy).toHaveBeenCalled();
    });

    it('should show error toast when update fails', () => {
      dealServiceSpy.updateDeal.and.returnValue(throwError(() => new Error()));
      component.onSubmit();
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to update deal', 'error');
    });
  });

  describe('delete flow', () => {
    beforeEach(() => buildFixture(mockDeal));

    it('should show confirm dialog on delete button click', () => {
      const deleteBtn = fixture.nativeElement.querySelector('.btn--danger');
      deleteBtn.click();
      fixture.detectChanges();
      expect(component.showDeleteDialog).toBeTrue();
      expect(fixture.nativeElement.querySelector('app-confirm-dialog')).toBeTruthy();
    });

    it('should close dialog without deleting on cancel', () => {
      component.showDeleteDialog = true;
      component.onDeleteConfirmed(false);
      expect(component.showDeleteDialog).toBeFalse();
      expect(dealServiceSpy.deleteDeal).not.toHaveBeenCalled();
    });

    it('should not delete when deal is null', () => {
      component.deal = null;
      component.onDeleteConfirmed(true);
      expect(dealServiceSpy.deleteDeal).not.toHaveBeenCalled();
    });

    it('should delete deal, show success toast, and emit saved', () => {
      dealServiceSpy.deleteDeal.and.returnValue(of(undefined));
      const savedSpy = jasmine.createSpy();
      component.saved.subscribe(savedSpy);
      component.onDeleteConfirmed(true);
      expect(dealServiceSpy.deleteDeal).toHaveBeenCalledWith('1');
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Deal deleted', 'success');
      expect(savedSpy).toHaveBeenCalled();
    });

    it('should show error toast when delete fails', () => {
      dealServiceSpy.deleteDeal.and.returnValue(throwError(() => new Error()));
      component.onDeleteConfirmed(true);
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to delete deal', 'error');
    });
  });

  describe('cancel', () => {
    beforeEach(() => buildFixture(null));

    it('should emit closed on cancel', () => {
      const closedSpy = jasmine.createSpy();
      component.closed.subscribe(closedSpy);
      component.onCancel();
      expect(closedSpy).toHaveBeenCalled();
    });

    it('should emit closed when close button clicked', () => {
      const closedSpy = jasmine.createSpy();
      component.closed.subscribe(closedSpy);
      fixture.nativeElement.querySelector('.drawer__close').click();
      expect(closedSpy).toHaveBeenCalled();
    });

    it('should emit closed when overlay clicked', () => {
      const closedSpy = jasmine.createSpy();
      component.closed.subscribe(closedSpy);
      fixture.nativeElement.querySelector('.drawer-overlay').click();
      expect(closedSpy).toHaveBeenCalled();
    });
  });

  describe('contact autocomplete', () => {
    beforeEach(() => buildFixture(null));

    it('should clear selectedContactId and hide dropdown when value is empty', () => {
      component.selectedContactId = 'c1';
      component.showContactDropdown = true;
      component.onContactSearch('');
      expect(component.selectedContactId).toBeNull();
      expect(component.showContactDropdown).toBeFalse();
    });

    it('should hide dropdown when value length < 2 without clearing id', () => {
      component.selectedContactId = 'c1';
      component.showContactDropdown = true;
      component.onContactSearch('a');
      expect(component.selectedContactId).toBe('c1');
      expect(component.showContactDropdown).toBeFalse();
      expect(contactServiceSpy.getContacts).not.toHaveBeenCalled();
    });

    it('should search contacts and show dropdown when value length >= 2', () => {
      component.onContactSearch('Al');
      expect(contactServiceSpy.getContacts).toHaveBeenCalledWith({ search: 'Al' });
      expect(component.contactResults.length).toBe(1);
      expect(component.showContactDropdown).toBeTrue();
    });

    it('should render contact dropdown options', () => {
      component.onContactSearch('Al');
      fixture.detectChanges();
      const options = fixture.nativeElement.querySelectorAll('.autocomplete__option');
      expect(options.length).toBe(1);
      expect(options[0].textContent.trim()).toBe('Alice');
    });

    it('should select contact and close dropdown on option click', () => {
      component.onContactSearch('Al');
      fixture.detectChanges();
      const option = fixture.nativeElement.querySelector('.autocomplete__option');
      option.dispatchEvent(new MouseEvent('mousedown'));
      expect(component.selectedContactId).toBe('c1');
      expect(component.contactSearchControl.value).toBe('Alice');
      expect(component.showContactDropdown).toBeFalse();
    });

    it('should show clear button when contact is selected', () => {
      component.selectedContactId = 'c1';
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.autocomplete__clear')).toBeTruthy();
    });

    it('should clear contact on clear button click', () => {
      component.selectedContactId = 'c1';
      component.contactSearchControl.setValue('Alice', { emitEvent: false });
      fixture.detectChanges();
      fixture.nativeElement.querySelector('.autocomplete__clear').click();
      expect(component.selectedContactId).toBeNull();
      expect(component.contactSearchControl.value).toBe('');
    });

    it('should hide dropdown on blur after 150ms', fakeAsync(() => {
      component.showContactDropdown = true;
      component.onContactBlur();
      expect(component.showContactDropdown).toBeTrue();
      tick(150);
      expect(component.showContactDropdown).toBeFalse();
    }));
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => buildFixture(null));

    it('should complete destroy$ on destroy', () => {
      const nextSpy = spyOn((component as any)['destroy$'], 'next');
      const completeSpy = spyOn((component as any)['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
