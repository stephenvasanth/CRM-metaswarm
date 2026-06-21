import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Router } from '@angular/router';
import { ContactService, Contact, Tag } from '../../../core/services/contact.service';
import { TagService, TagWithCount } from '../../../core/services/tag.service';
import { ToastService } from '../../../core/services/toast.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { TagChipComponent } from '../../../shared/components/tag-chip/tag-chip.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-contacts-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AvatarComponent, TagChipComponent, ConfirmDialogComponent],
  template: `
    <div class="contacts-page">
      <header class="contacts-page__header">
        <h1 class="contacts-page__title">Contacts</h1>
        <button class="btn btn--primary" (click)="navigateToCreate()">New Contact</button>
      </header>

      <div class="contacts-page__toolbar">
        <div class="search-box">
          <input
            type="text"
            class="search-box__input"
            placeholder="Search contacts…"
            [formControl]="searchControl"
            aria-label="Search contacts"
          />
          @if (searchControl.value) {
            <button
              class="search-box__clear"
              type="button"
              (click)="clearSearch()"
              aria-label="Clear search"
            >×</button>
          }
        </div>

        <select
          class="tag-filter"
          [value]="selectedTagId"
          (change)="onTagFilterChange($any($event.target).value)"
          aria-label="Filter by tag"
        >
          <option value="">All tags</option>
          @for (tag of availableTags; track tag.id) {
            <option [value]="tag.id">{{ tag.name }}</option>
          }
        </select>
      </div>

      @if (loading) {
        <div class="contacts-page__loading" aria-live="polite" aria-busy="true">
          <p>Loading contacts…</p>
        </div>
      } @else if (contacts.length === 0) {
        <div class="contacts-page__empty">
          <div class="empty-state">
            <div class="empty-state__icon" aria-hidden="true">👥</div>
            <h2 class="empty-state__title">No contacts yet</h2>
            <p class="empty-state__message">Add your first contact to get started.</p>
            <button class="btn btn--primary" (click)="navigateToCreate()">Add Contact</button>
          </div>
        </div>
      } @else {
        <div class="contacts-table-wrapper">
          <table class="contacts-table" aria-label="Contacts">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Company</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Tags</th>
                <th scope="col">Owner</th>
                <th scope="col"><span class="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              @for (contact of contacts; track contact.id) {
                <tr class="contacts-table__row" (click)="navigateToDetail(contact.id)">
                  <td class="contacts-table__name">
                    <app-avatar [name]="contact.name" [size]="32" />
                    <span class="contacts-table__name-text">{{ contact.name }}</span>
                  </td>
                  <td>{{ contact.company?.name ?? '—' }}</td>
                  <td>{{ contact.email }}</td>
                  <td>{{ contact.phone ?? '—' }}</td>
                  <td class="contacts-table__tags">
                    @for (tag of contact.tags; track tag.id) {
                      <app-tag-chip [tag]="tag" />
                    }
                  </td>
                  <td>{{ contact.owner?.name ?? '—' }}</td>
                  <td class="contacts-table__actions" (click)="$event.stopPropagation()">
                    <a
                      [routerLink]="['/contacts', contact.id, 'edit']"
                      class="btn-icon"
                      aria-label="Edit contact"
                    >Edit</a>
                    <button
                      class="btn-icon btn-icon--danger"
                      type="button"
                      (click)="confirmDelete(contact)"
                      aria-label="Delete contact"
                    >Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <span class="pagination__info">{{ totalElements }} contacts</span>
          <div class="pagination__controls">
            <label class="pagination__size-label">
              Rows:
              <select
                class="pagination__size"
                [value]="pageSize"
                (change)="onPageSizeChange(+$any($event.target).value)"
                aria-label="Rows per page"
              >
                <option [value]="10">10</option>
                <option [value]="20">20</option>
                <option [value]="50">50</option>
              </select>
            </label>
            <button
              class="pagination__btn"
              type="button"
              [disabled]="currentPage === 0"
              (click)="onPageChange(currentPage - 1)"
              aria-label="Previous page"
            >←</button>
            <span class="pagination__page">{{ currentPage + 1 }} / {{ totalPages }}</span>
            <button
              class="pagination__btn"
              type="button"
              [disabled]="currentPage >= totalPages - 1"
              (click)="onPageChange(currentPage + 1)"
              aria-label="Next page"
            >→</button>
          </div>
        </div>
      }
    </div>

    @if (showDeleteDialog && contactToDelete) {
      <app-confirm-dialog
        title="Delete Contact"
        [message]="'Delete ' + contactToDelete.name + '? Linked activities will also be removed.'"
        confirmLabel="Delete"
        (confirmed)="onDeleteConfirmed($event)"
      />
    }
  `,
  styles: [`
    .contacts-page {
      padding: var(--space-6);
      max-width: 100%;
    }

    .contacts-page__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-6);
    }

    .contacts-page__title {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }

    .contacts-page__toolbar {
      display: flex;
      gap: var(--space-3);
      margin-bottom: var(--space-4);
      align-items: center;
    }

    .search-box {
      position: relative;
      flex: 1;
      max-width: 360px;
    }

    .search-box__input {
      width: 100%;
      padding: var(--space-2) var(--space-3);
      padding-right: var(--space-8);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text-primary);
    }

    .search-box__input:focus {
      border-color: var(--color-primary);
      outline: none;
    }

    .search-box__clear {
      position: absolute;
      right: var(--space-2);
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--color-text-secondary);
      font-size: var(--font-size-md);
      cursor: pointer;
      line-height: 1;
      padding: 0 var(--space-1);
    }

    .tag-filter {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      color: var(--color-text-primary);
      min-width: 150px;
    }

    .contacts-page__loading,
    .contacts-page__empty {
      padding: var(--space-12);
      text-align: center;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
    }

    .empty-state__icon {
      font-size: 48px;
    }

    .empty-state__title {
      font-size: var(--font-size-lg);
      color: var(--color-text-primary);
    }

    .empty-state__message {
      color: var(--color-text-secondary);
    }

    .contacts-table-wrapper {
      overflow-x: auto;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
    }

    .contacts-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--font-size-base);
    }

    .contacts-table th {
      padding: var(--space-3) var(--space-4);
      text-align: left;
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
      background: var(--color-background);
      border-bottom: 1px solid var(--color-border);
    }

    .contacts-table td {
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--color-border);
      color: var(--color-text-primary);
      vertical-align: middle;
    }

    .contacts-table__row {
      cursor: pointer;
      transition: background-color 100ms;
    }

    .contacts-table__row:hover {
      background-color: var(--color-background);
    }

    .contacts-table__row:hover .contacts-table__actions {
      opacity: 1;
    }

    .contacts-table__name {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .contacts-table__name-text {
      font-weight: var(--font-weight-medium);
    }

    .contacts-table__tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
    }

    .contacts-table__actions {
      opacity: 0;
      display: flex;
      gap: var(--space-2);
      transition: opacity 100ms;
      white-space: nowrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      padding: var(--space-2) var(--space-4);
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

    .btn--primary:hover {
      background-color: var(--color-primary-dark);
    }

    .btn-icon {
      display: inline-flex;
      align-items: center;
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-medium);
      background: none;
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
      cursor: pointer;
      text-decoration: none;
    }

    .btn-icon--danger {
      color: var(--color-danger);
      border-color: var(--color-danger);
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) 0;
    }

    .pagination__info {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .pagination__controls {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .pagination__size-label {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .pagination__size {
      padding: var(--space-1) var(--space-2);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
    }

    .pagination__btn {
      padding: var(--space-1) var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      cursor: pointer;
      font-size: var(--font-size-sm);
    }

    .pagination__btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .pagination__page {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      min-width: 60px;
      text-align: center;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `],
})
export class ContactsListComponent implements OnInit, OnDestroy {
  private readonly contactService = inject(ContactService);
  private readonly tagService = inject(TagService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly searchControl = new FormControl('', { nonNullable: true });
  selectedTagId = '';
  currentPage = 0;
  pageSize = 20;

  contacts: Contact[] = [];
  totalElements = 0;
  totalPages = 0;
  availableTags: TagWithCount[] = [];
  loading = false;

  contactToDelete: Contact | null = null;
  showDeleteDialog = false;

  ngOnInit(): void {
    this.tagService.getTags().pipe(takeUntil(this.destroy$)).subscribe({
      next: (tags) => { this.availableTags = tags; },
    });

    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => {
      this.currentPage = 0;
      this.loadContacts();
    });

    this.loadContacts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadContacts(): void {
    this.loading = true;
    this.contactService.getContacts({
      search: this.searchControl.value || undefined,
      page: this.currentPage,
      size: this.pageSize,
      tagId: this.selectedTagId || undefined,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (page) => {
        this.contacts = page.content;
        this.totalElements = page.totalElements;
        this.totalPages = page.totalPages;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.add('Failed to load contacts', 'error');
      },
    });
  }

  clearSearch(): void {
    this.searchControl.setValue('', { emitEvent: false });
    this.currentPage = 0;
    this.loadContacts();
  }

  onTagFilterChange(tagId: string): void {
    this.selectedTagId = tagId;
    this.currentPage = 0;
    this.loadContacts();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadContacts();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadContacts();
  }

  confirmDelete(contact: Contact): void {
    this.contactToDelete = contact;
    this.showDeleteDialog = true;
  }

  onDeleteConfirmed(confirmed: boolean): void {
    this.showDeleteDialog = false;
    if (!confirmed || !this.contactToDelete) {
      this.contactToDelete = null;
      return;
    }
    const id = this.contactToDelete.id;
    this.contactToDelete = null;
    this.contactService.deleteContact(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toastService.add('Contact deleted', 'success');
        this.loadContacts();
      },
      error: () => {
        this.toastService.add('Failed to delete contact', 'error');
      },
    });
  }

  navigateToDetail(id: string): void {
    this.router.navigate(['/contacts', id]);
  }

  navigateToCreate(): void {
    this.router.navigate(['/contacts/new']);
  }
}
