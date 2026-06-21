import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import {
  ContactService,
  Contact,
  Company,
  Tag,
  CreateContactRequest,
} from '../../../core/services/contact.service';
import { CompanyService } from '../../../core/services/company.service';
import { TagService, TagWithCount } from '../../../core/services/tag.service';
import { ToastService } from '../../../core/services/toast.service';
import { TagChipComponent } from '../../../shared/components/tag-chip/tag-chip.component';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TagChipComponent],
  template: `
    <div class="contact-form-page">
      <header class="contact-form-page__header">
        <a routerLink="/contacts" class="back-link">← Contacts</a>
        <h1 class="contact-form-page__title">{{ isEditMode ? 'Edit Contact' : 'New Contact' }}</h1>
      </header>

      @if (loading) {
        <div class="form-loading" aria-live="polite" aria-busy="true">
          <p>Loading contact…</p>
        </div>
      } @else {
        <form class="contact-form" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="form-section">
            <div class="form-row">
              <div class="form-field">
                <label for="firstName" class="form-field__label">
                  First Name <span class="form-field__required" aria-hidden="true">*</span>
                </label>
                <input
                  id="firstName"
                  type="text"
                  class="form-field__input"
                  [class.form-field__input--error]="isFieldInvalid('firstName')"
                  formControlName="firstName"
                  placeholder="First name"
                  autocomplete="given-name"
                />
                @if (isFieldInvalid('firstName')) {
                  <p class="form-field__error" role="alert">First name is required.</p>
                }
              </div>

              <div class="form-field">
                <label for="lastName" class="form-field__label">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  class="form-field__input"
                  formControlName="lastName"
                  placeholder="Last name"
                  autocomplete="family-name"
                />
              </div>
            </div>

            <div class="form-field">
              <label for="email" class="form-field__label">
                Email <span class="form-field__required" aria-hidden="true">*</span>
              </label>
              <input
                id="email"
                type="email"
                class="form-field__input"
                [class.form-field__input--error]="isFieldInvalid('email')"
                formControlName="email"
                placeholder="email@example.com"
                autocomplete="email"
              />
              @if (isFieldInvalid('email') && form.controls.email.hasError('required')) {
                <p class="form-field__error" role="alert">Email is required.</p>
              } @else if (isFieldInvalid('email') && form.controls.email.hasError('email')) {
                <p class="form-field__error" role="alert">Enter a valid email address.</p>
              }
            </div>

            <div class="form-field">
              <label for="phone" class="form-field__label">Phone</label>
              <input
                id="phone"
                type="tel"
                class="form-field__input"
                formControlName="phone"
                placeholder="Phone number"
                autocomplete="tel"
              />
            </div>

            <div class="form-field">
              <label for="jobTitle" class="form-field__label">Job Title</label>
              <input
                id="jobTitle"
                type="text"
                class="form-field__input"
                formControlName="jobTitle"
                placeholder="e.g. VP of Sales"
              />
            </div>

            <div class="form-field" (clickOutside)="hideCompanyDropdown()">
              <label for="companySearch" class="form-field__label">Company</label>
              <div class="autocomplete">
                <input
                  id="companySearch"
                  type="text"
                  class="form-field__input"
                  [value]="companySearchControl.value"
                  (input)="onCompanySearch($any($event.target).value)"
                  (blur)="onCompanyBlur()"
                  placeholder="Search companies…"
                  autocomplete="off"
                  aria-autocomplete="list"
                  [attr.aria-expanded]="showCompanyDropdown"
                />
                @if (showCompanyDropdown && filteredCompanies.length > 0) {
                  <ul class="autocomplete__list" role="listbox" aria-label="Company suggestions">
                    @for (company of filteredCompanies; track company.id) {
                      <li
                        class="autocomplete__item"
                        role="option"
                        (mousedown)="selectCompany(company)"
                      >{{ company.name }}</li>
                    }
                  </ul>
                }
                @if (form.controls.companyId.value) {
                  <button
                    type="button"
                    class="autocomplete__clear"
                    (click)="clearCompany()"
                    aria-label="Clear company"
                  >×</button>
                }
              </div>
            </div>

            <div class="form-field">
              <label class="form-field__label">Tags</label>
              <div class="tag-select">
                <button
                  type="button"
                  class="tag-select__trigger"
                  (click)="toggleTagDropdown()"
                  [attr.aria-expanded]="showTagDropdown"
                >
                  @if (form.controls.tagIds.value.length > 0) {
                    {{ form.controls.tagIds.value.length }} tag(s) selected
                  } @else {
                    Select tags
                  }
                </button>
                @if (showTagDropdown) {
                  <div class="tag-select__dropdown" role="listbox" aria-multiselectable="true">
                    @if (availableTags.length === 0) {
                      <p class="tag-select__empty">No tags available.</p>
                    } @else {
                      @for (tag of availableTags; track tag.id) {
                        <label class="tag-select__option">
                          <input
                            type="checkbox"
                            [checked]="isTagSelected(tag.id.toString())"
                            (change)="toggleTag(tag.id.toString())"
                          />
                          <app-tag-chip [tag]="tagAsChip(tag)" />
                        </label>
                      }
                    }
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="contact-form__actions">
            <button
              type="button"
              class="btn btn--secondary"
              (click)="onCancel()"
            >Cancel</button>
            <button
              type="submit"
              class="btn btn--primary"
              [disabled]="submitting"
            >{{ submitting ? 'Saving…' : (isEditMode ? 'Save Changes' : 'Create Contact') }}</button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .contact-form-page {
      padding: var(--space-6);
      max-width: 640px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
    }

    .contact-form-page__header {
      margin-bottom: var(--space-6);
    }

    .back-link {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      text-decoration: none;
      display: block;
      margin-bottom: var(--space-3);
    }

    .back-link:hover {
      color: var(--color-primary);
    }

    .contact-form-page__title {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
    }

    .form-loading {
      padding: var(--space-12);
      text-align: center;
    }

    .contact-form {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .form-field__label {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-primary);
    }

    .form-field__required {
      color: var(--color-danger);
    }

    .form-field__input {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
      background: var(--color-surface);
      width: 100%;
    }

    .form-field__input:focus {
      border-color: var(--color-primary);
      outline: none;
    }

    .form-field__input--error {
      border-color: var(--color-danger);
    }

    .form-field__error {
      font-size: var(--font-size-sm);
      color: var(--color-danger);
    }

    .autocomplete {
      position: relative;
    }

    .autocomplete__list {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-md);
      list-style: none;
      max-height: 200px;
      overflow-y: auto;
      z-index: 100;
    }

    .autocomplete__item {
      padding: var(--space-2) var(--space-3);
      cursor: pointer;
      font-size: var(--font-size-base);
    }

    .autocomplete__item:hover {
      background: var(--color-background);
    }

    .autocomplete__clear {
      position: absolute;
      right: var(--space-2);
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--color-text-secondary);
      font-size: var(--font-size-md);
      cursor: pointer;
      padding: 0 var(--space-1);
    }

    .tag-select__trigger {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      font-size: var(--font-size-base);
      cursor: pointer;
      text-align: left;
      width: 100%;
      color: var(--color-text-primary);
    }

    .tag-select__dropdown {
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      background: var(--color-surface);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-top: var(--space-1);
    }

    .tag-select__option {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      cursor: pointer;
      font-size: var(--font-size-base);
    }

    .tag-select__empty {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .contact-form__actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      margin-top: var(--space-6);
      padding-top: var(--space-6);
      border-top: 1px solid var(--color-border);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      padding: var(--space-2) var(--space-5);
      border-radius: var(--radius-md);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      border: none;
      cursor: pointer;
      transition: background-color 150ms;
    }

    .btn--primary {
      background-color: var(--color-primary);
      color: var(--color-surface);
    }

    .btn--primary:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
    }

    .btn--primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn--secondary {
      background-color: var(--color-background);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
    }

    .btn--secondary:hover {
      background-color: var(--color-border);
    }
  `],
})
export class ContactFormComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contactService = inject(ContactService);
  private readonly companyService = inject(CompanyService);
  private readonly tagService = inject(TagService);
  private readonly toastService = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  isEditMode = false;
  contactId: string | null = null;
  loading = false;
  submitting = false;

  companies: Company[] = [];
  filteredCompanies: Company[] = [];
  availableTags: TagWithCount[] = [];
  showCompanyDropdown = false;
  showTagDropdown = false;

  readonly companySearchControl = new FormControl('', { nonNullable: true });

  readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lastName: new FormControl('', { nonNullable: true }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    phone: new FormControl('', { nonNullable: true }),
    jobTitle: new FormControl('', { nonNullable: true }),
    companyId: new FormControl<string | null>(null),
    tagIds: new FormControl<string[]>([], { nonNullable: true }),
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.contactId = id;
      this.loading = true;
      this.contactService.getContact(id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (contact) => {
          this.loading = false;
          this.patchForm(contact);
        },
        error: () => {
          this.loading = false;
          this.toastService.add('Failed to load contact', 'error');
          this.router.navigate(['/contacts']);
        },
      });
    }

    this.companyService.getCompanies().pipe(takeUntil(this.destroy$)).subscribe({
      next: (companies) => {
        this.companies = companies;
        this.filteredCompanies = companies;
      },
    });

    this.tagService.getTags().pipe(takeUntil(this.destroy$)).subscribe({
      next: (tags) => { this.availableTags = tags; },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private patchForm(contact: Contact): void {
    this.form.patchValue({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone ?? '',
      jobTitle: contact.jobTitle ?? '',
      companyId: contact.company?.id ?? null,
      tagIds: contact.tags.map((t) => t.id),
    });
    if (contact.company) {
      this.companySearchControl.setValue(contact.company.name, { emitEvent: false });
    }
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  onCompanySearch(value: string): void {
    this.filteredCompanies = value.trim()
      ? this.companies.filter((c) => c.name.toLowerCase().includes(value.toLowerCase()))
      : [...this.companies];
    this.showCompanyDropdown = true;
    if (!value.trim()) {
      this.form.controls.companyId.setValue(null);
    }
  }

  onCompanyBlur(): void {
    setTimeout(() => { this.showCompanyDropdown = false; }, 150);
  }

  hideCompanyDropdown(): void {
    this.showCompanyDropdown = false;
  }

  selectCompany(company: Company): void {
    this.form.controls.companyId.setValue(company.id);
    this.companySearchControl.setValue(company.name, { emitEvent: false });
    this.showCompanyDropdown = false;
    this.filteredCompanies = [];
  }

  clearCompany(): void {
    this.form.controls.companyId.setValue(null);
    this.companySearchControl.setValue('', { emitEvent: false });
    this.filteredCompanies = [...this.companies];
  }

  isTagSelected(tagId: string): boolean {
    return this.form.controls.tagIds.value.includes(tagId);
  }

  toggleTag(tagId: string): void {
    const current = [...this.form.controls.tagIds.value];
    const idx = current.indexOf(tagId);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(tagId);
    }
    this.form.controls.tagIds.setValue(current);
  }

  toggleTagDropdown(): void {
    this.showTagDropdown = !this.showTagDropdown;
  }

  tagAsChip(tag: TagWithCount): Tag {
    return { id: String(tag.id), name: tag.name, colour: tag.colour };
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const req: CreateContactRequest = {
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      email: value.email,
      phone: value.phone || undefined,
      jobTitle: value.jobTitle || undefined,
      companyId: value.companyId ? Number(value.companyId) : undefined,
      tagIds: value.tagIds.map(Number),
    };

    this.submitting = true;
    const request$ =
      this.isEditMode && this.contactId
        ? this.contactService.updateContact(this.contactId, req)
        : this.contactService.createContact(req);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (contact) => {
        this.submitting = false;
        this.toastService.add(
          this.isEditMode ? 'Contact updated' : 'Contact created',
          'success'
        );
        this.router.navigate(['/contacts', contact.id]);
      },
      error: () => {
        this.submitting = false;
        this.toastService.add('Failed to save contact', 'error');
      },
    });
  }

  onCancel(): void {
    if (this.isEditMode && this.contactId) {
      this.router.navigate(['/contacts', this.contactId]);
    } else {
      this.router.navigate(['/contacts']);
    }
  }
}
