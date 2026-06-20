import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DealService, Deal, DealStage, CreateDealRequest, DealContact, DEAL_STAGES } from '../../../core/services/deal.service';
import { ContactService } from '../../../core/services/contact.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-deal-drawer',
  standalone: true,
  imports: [ReactiveFormsModule, ConfirmDialogComponent],
  template: `
    <div class="drawer-overlay" (click)="onCancel()"></div>
    <aside class="drawer">
      <div class="drawer__header">
        <h2 class="drawer__title">{{ isEditMode ? 'Edit Deal' : 'New Deal' }}</h2>
        <button class="drawer__close" (click)="onCancel()" aria-label="Close drawer">✕</button>
      </div>

      <form class="drawer__body" [formGroup]="form" (ngSubmit)="onSubmit()">
        <div class="form-field">
          <label class="form-field__label" for="deal-title">Title *</label>
          <input id="deal-title" class="form-field__input"
                 [class.form-field__input--error]="isFieldInvalid('title')"
                 formControlName="title"
                 placeholder="Deal title">
          @if (isFieldInvalid('title')) {
            <span class="form-field__error">Title is required</span>
          }
        </div>

        <div class="form-field">
          <label class="form-field__label" for="deal-value">Value</label>
          <input id="deal-value" class="form-field__input"
                 type="number" formControlName="value"
                 placeholder="0">
        </div>

        <div class="form-field">
          <label class="form-field__label" for="deal-stage">Stage</label>
          <select id="deal-stage" class="form-field__input" formControlName="stage">
            @for (s of stages; track s.key) {
              <option [value]="s.key">{{ s.label }}</option>
            }
          </select>
        </div>

        <div class="form-field">
          <label class="form-field__label" for="deal-close-date">Expected Close Date</label>
          <input id="deal-close-date" class="form-field__input"
                 type="date" formControlName="closeDate">
        </div>

        <div class="form-field form-field--autocomplete">
          <label class="form-field__label" for="deal-contact">Contact</label>
          <div class="autocomplete">
            <input id="deal-contact" class="form-field__input"
                   [formControl]="contactSearchControl"
                   placeholder="Search contacts..."
                   (input)="onContactSearch(contactSearchControl.value)"
                   (blur)="onContactBlur()"
                   autocomplete="off">
            @if (selectedContactId) {
              <button type="button" class="autocomplete__clear" (click)="clearContact()" aria-label="Clear contact">✕</button>
            }
            @if (showContactDropdown && contactResults.length > 0) {
              <ul class="autocomplete__dropdown">
                @for (c of contactResults; track c.id) {
                  <li class="autocomplete__option" (mousedown)="selectContact(c)">{{ c.name }}</li>
                }
              </ul>
            }
          </div>
        </div>

        <div class="form-field">
          <label class="form-field__label" for="deal-notes">Notes</label>
          <textarea id="deal-notes" class="form-field__input form-field__input--textarea"
                    formControlName="notes"
                    rows="3"
                    placeholder="Add notes..."></textarea>
        </div>

        <div class="drawer__actions">
          <button type="button" class="btn btn--ghost" (click)="onCancel()">Cancel</button>
          @if (isEditMode) {
            <button type="button" class="btn btn--danger" (click)="showDeleteDialog = true">Delete</button>
          }
          <button type="submit" class="btn btn--primary">{{ isEditMode ? 'Save' : 'Create' }}</button>
        </div>
      </form>
    </aside>

    @if (showDeleteDialog) {
      <app-confirm-dialog
        [message]="'Delete deal &quot;' + deal!.title + '&quot;? This cannot be undone.'"
        (confirmed)="onDeleteConfirmed($event)">
      </app-confirm-dialog>
    }
  `,
  styles: [`
    .drawer-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 100;
    }
    .drawer {
      position: fixed; top: 0; right: 0; bottom: 0; width: 400px;
      background: var(--color-surface); z-index: 101;
      display: flex; flex-direction: column;
      box-shadow: var(--shadow-lg);
    }
    .drawer__header {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-6); border-bottom: 1px solid var(--color-border);
    }
    .drawer__title { font-size: var(--font-size-md); font-weight: var(--font-weight-semibold); margin: 0; }
    .drawer__close { background: none; border: none; cursor: pointer; font-size: 18px; color: var(--color-text-secondary); }
    .drawer__body { flex: 1; overflow-y: auto; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
    .drawer__actions { display: flex; gap: var(--space-3); justify-content: flex-end; padding-top: var(--space-4); border-top: 1px solid var(--color-border); margin-top: auto; }
    .form-field { display: flex; flex-direction: column; gap: var(--space-1); }
    .form-field__label { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-text-primary); }
    .form-field__input { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-size: var(--font-size-base); }
    .form-field__input--error { border-color: var(--color-danger); }
    .form-field__input--textarea { resize: vertical; }
    .form-field__error { font-size: var(--font-size-xs); color: var(--color-danger); }
    .autocomplete { position: relative; }
    .autocomplete__clear { position: absolute; right: var(--space-2); top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--color-text-secondary); }
    .autocomplete__dropdown { position: absolute; top: 100%; left: 0; right: 0; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-md); list-style: none; margin: 0; padding: var(--space-1) 0; z-index: 10; max-height: 200px; overflow-y: auto; }
    .autocomplete__option { padding: var(--space-2) var(--space-3); cursor: pointer; font-size: var(--font-size-sm); }
    .autocomplete__option:hover { background: var(--color-primary-light); }
    .btn { padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); cursor: pointer; border: none; }
    .btn--primary { background: var(--color-primary); color: #fff; }
    .btn--ghost { background: transparent; border: 1px solid var(--color-border); color: var(--color-text-primary); }
    .btn--danger { background: var(--color-danger); color: #fff; }
  `]
})
export class DealDrawerComponent implements OnInit, OnDestroy {
  @Input() deal: Deal | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private readonly dealService = inject(DealService);
  private readonly contactService = inject(ContactService);
  private readonly toastService = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  isEditMode = false;
  showDeleteDialog = false;
  contactResults: DealContact[] = [];
  showContactDropdown = false;
  selectedContactId: string | null = null;

  readonly stages = DEAL_STAGES;

  readonly contactSearchControl = new FormControl('', { nonNullable: true });

  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    value: new FormControl<number | null>(null),
    stage: new FormControl<DealStage>('LEAD', { nonNullable: true }),
    closeDate: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  ngOnInit(): void {
    if (this.deal) {
      this.isEditMode = true;
      this.patchForm(this.deal);
    }
  }

  private patchForm(deal: Deal): void {
    this.form.patchValue({
      title: deal.title,
      value: deal.value ?? null,
      stage: deal.stage,
      closeDate: deal.closeDate ?? '',
      notes: deal.notes ?? '',
    });
    if (deal.contact) {
      this.selectedContactId = deal.contact.id;
      this.contactSearchControl.setValue(deal.contact.name, { emitEvent: false });
    }
  }

  onContactSearch(value: string): void {
    if (!value) {
      this.selectedContactId = null;
      this.showContactDropdown = false;
      return;
    }
    if (value.length < 2) {
      this.showContactDropdown = false;
      return;
    }
    this.contactService.getContacts({ search: value })
      .pipe(takeUntil(this.destroy$))
      .subscribe(page => {
        this.contactResults = page.content.map(c => ({ id: c.id, name: c.name }));
        this.showContactDropdown = true;
      });
  }

  selectContact(contact: DealContact): void {
    this.selectedContactId = contact.id;
    this.contactSearchControl.setValue(contact.name, { emitEvent: false });
    this.showContactDropdown = false;
  }

  clearContact(): void {
    this.selectedContactId = null;
    this.contactSearchControl.setValue('', { emitEvent: false });
    this.showContactDropdown = false;
  }

  onContactBlur(): void {
    setTimeout(() => { this.showContactDropdown = false; }, 150);
  }

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl && ctrl.invalid && ctrl.touched;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const val = this.form.getRawValue();
    const req: CreateDealRequest = {
      title: val.title,
      value: val.value ?? undefined,
      stage: val.stage,
      closeDate: val.closeDate || undefined,
      contactId: this.selectedContactId ?? undefined,
      notes: val.notes || undefined,
    };
    const op = this.isEditMode
      ? this.dealService.updateDeal(this.deal!.id, req)
      : this.dealService.createDeal(req);

    op.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toastService.add(this.isEditMode ? 'Deal updated' : 'Deal created', 'success');
        this.saved.emit();
      },
      error: () => {
        this.toastService.add(this.isEditMode ? 'Failed to update deal' : 'Failed to create deal', 'error');
      },
    });
  }

  onDeleteConfirmed(confirmed: boolean): void {
    if (!confirmed) {
      this.showDeleteDialog = false;
      return;
    }
    if (!this.deal) return;
    this.dealService.deleteDeal(this.deal.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.toastService.add('Deal deleted', 'success');
        this.saved.emit();
      },
      error: () => {
        this.toastService.add('Failed to delete deal', 'error');
      },
    });
  }

  onCancel(): void {
    this.closed.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
