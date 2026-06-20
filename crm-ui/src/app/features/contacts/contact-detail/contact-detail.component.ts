import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ContactService, Contact } from '../../../core/services/contact.service';
import { ToastService } from '../../../core/services/toast.service';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { TagChipComponent } from '../../../shared/components/tag-chip/tag-chip.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-contact-detail',
  standalone: true,
  imports: [RouterLink, AvatarComponent, TagChipComponent, ConfirmDialogComponent],
  template: `
    @if (loading) {
      <div class="detail-loading" aria-live="polite" aria-busy="true">
        <p>Loading contact…</p>
      </div>
    } @else if (contact) {
      <div class="contact-detail">
        <div class="contact-detail__bar">
          <a routerLink="/contacts" class="back-link">← Contacts</a>
          <div class="contact-detail__actions">
            <a [routerLink]="['/contacts', contact.id, 'edit']" class="btn btn--secondary">Edit</a>
            <button
              class="btn btn--danger"
              type="button"
              (click)="openDeleteDialog()"
            >Delete</button>
          </div>
        </div>

        <div class="contact-detail__body">
          <aside class="contact-detail__left">
            <div class="contact-hero">
              <app-avatar [name]="contact.name" [size]="64" />
              <div class="contact-hero__info">
                <h1 class="contact-hero__name">{{ contact.name }}</h1>
                @if (contact.jobTitle) {
                  <p class="contact-hero__title">{{ contact.jobTitle }}</p>
                }
              </div>
            </div>

            <div class="info-grid">
              <div class="info-grid__row">
                <span class="info-grid__label">Email</span>
                <a [href]="'mailto:' + contact.email" class="info-grid__value info-grid__value--link">
                  {{ contact.email }}
                </a>
              </div>
              @if (contact.phone) {
                <div class="info-grid__row">
                  <span class="info-grid__label">Phone</span>
                  <a [href]="'tel:' + contact.phone" class="info-grid__value info-grid__value--link">
                    {{ contact.phone }}
                  </a>
                </div>
              }
              @if (contact.company) {
                <div class="info-grid__row">
                  <span class="info-grid__label">Company</span>
                  <span class="info-grid__value">{{ contact.company.name }}</span>
                </div>
              }
              @if (contact.owner) {
                <div class="info-grid__row">
                  <span class="info-grid__label">Owner</span>
                  <span class="info-grid__value">{{ contact.owner.name }}</span>
                </div>
              }
              <div class="info-grid__row">
                <span class="info-grid__label">Added</span>
                <span class="info-grid__value">{{ formatDate(contact.createdAt) }}</span>
              </div>
            </div>

            @if (contact.tags.length > 0) {
              <div class="contact-tags">
                <h3 class="contact-tags__heading">Tags</h3>
                <div class="contact-tags__list">
                  @for (tag of contact.tags; track tag.id) {
                    <app-tag-chip [tag]="tag" />
                  }
                </div>
              </div>
            }

            <div class="linked-deals">
              <h3 class="linked-deals__heading">Deals</h3>
              <p class="linked-deals__placeholder">Deals will appear here after WU-09.</p>
            </div>
          </aside>

          <main class="contact-detail__right">
            <div class="detail-tabs">
              <button
                class="detail-tabs__tab"
                [class.detail-tabs__tab--active]="activeTab === 'activities'"
                type="button"
                (click)="setTab('activities')"
              >Activities</button>
              <button
                class="detail-tabs__tab"
                [class.detail-tabs__tab--active]="activeTab === 'tasks'"
                type="button"
                (click)="setTab('tasks')"
              >Tasks</button>
            </div>

            <div class="detail-tabs__content">
              @if (activeTab === 'activities') {
                <p class="detail-tabs__placeholder">Activities will appear here after WU-11.</p>
              } @else {
                <p class="detail-tabs__placeholder">Tasks will appear here after WU-12.</p>
              }
            </div>
          </main>
        </div>
      </div>
    }

    @if (showDeleteDialog) {
      <app-confirm-dialog
        title="Delete Contact"
        [message]="'Delete ' + (contact?.name ?? '') + '? This cannot be undone.'"
        (confirmed)="onDeleteConfirmed($event)"
      />
    }
  `,
  styles: [`
    .detail-loading {
      padding: var(--space-12);
      text-align: center;
    }

    .contact-detail__bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-6);
      border-bottom: 1px solid var(--color-border);
      background: var(--color-surface);
    }

    .back-link {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      text-decoration: none;
    }

    .back-link:hover {
      color: var(--color-primary);
    }

    .contact-detail__actions {
      display: flex;
      gap: var(--space-3);
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
      text-decoration: none;
      transition: background-color 150ms;
    }

    .btn--secondary {
      background-color: var(--color-background);
      border: 1px solid var(--color-border);
      color: var(--color-text-primary);
    }

    .btn--secondary:hover {
      background-color: var(--color-border);
    }

    .btn--danger {
      background-color: var(--color-danger);
      color: var(--color-surface);
    }

    .btn--danger:hover {
      background-color: #DC2626;
    }

    .contact-detail__body {
      display: grid;
      grid-template-columns: 360px 1fr;
      min-height: calc(100vh - 120px);
    }

    .contact-detail__left {
      padding: var(--space-6);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      gap: var(--space-6);
      background: var(--color-surface);
    }

    .contact-hero {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .contact-hero__name {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      color: var(--color-text-primary);
    }

    .contact-hero__title {
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
      margin-top: var(--space-1);
    }

    .info-grid {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .info-grid__row {
      display: grid;
      grid-template-columns: 80px 1fr;
      gap: var(--space-3);
      align-items: start;
    }

    .info-grid__label {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
      font-weight: var(--font-weight-medium);
    }

    .info-grid__value {
      font-size: var(--font-size-base);
      color: var(--color-text-primary);
    }

    .info-grid__value--link {
      color: var(--color-primary);
      text-decoration: none;
    }

    .info-grid__value--link:hover {
      text-decoration: underline;
    }

    .contact-tags__heading,
    .linked-deals__heading {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-secondary);
      margin-bottom: var(--space-2);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .contact-tags__list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    .linked-deals__placeholder {
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }

    .contact-detail__right {
      padding: var(--space-6);
      background: var(--color-background);
    }

    .detail-tabs {
      display: flex;
      gap: 0;
      border-bottom: 2px solid var(--color-border);
      margin-bottom: var(--space-4);
    }

    .detail-tabs__tab {
      padding: var(--space-3) var(--space-5);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      border: none;
      background: none;
      color: var(--color-text-secondary);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
    }

    .detail-tabs__tab--active {
      color: var(--color-primary);
      border-bottom-color: var(--color-primary);
    }

    .detail-tabs__placeholder {
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
    }
  `],
})
export class ContactDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contactService = inject(ContactService);
  private readonly toastService = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  contact: Contact | null = null;
  loading = false;
  showDeleteDialog = false;
  activeTab: 'activities' | 'tasks' = 'activities';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loading = true;
    this.contactService.getContact(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (contact) => {
        this.contact = contact;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.add('Failed to load contact', 'error');
        this.router.navigate(['/contacts']);
      },
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setTab(tab: 'activities' | 'tasks'): void {
    this.activeTab = tab;
  }

  openDeleteDialog(): void {
    this.showDeleteDialog = true;
  }

  onDeleteConfirmed(confirmed: boolean): void {
    this.showDeleteDialog = false;
    if (!confirmed || !this.contact) {
      return;
    }
    const id = this.contact.id;
    this.contactService.deleteContact(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toastService.add('Contact deleted', 'success');
        this.router.navigate(['/contacts']);
      },
      error: () => {
        this.toastService.add('Failed to delete contact', 'error');
      },
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
