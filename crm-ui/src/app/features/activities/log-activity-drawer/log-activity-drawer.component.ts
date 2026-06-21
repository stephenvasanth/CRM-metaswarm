import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivityService, Activity, CreateActivityRequest } from '../../../core/services/activity.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-log-activity-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="drawer-overlay" (click)="closed.emit()"></div>
    <aside class="drawer">
      <div class="drawer__header">
        <h2 class="drawer__title">Log Activity</h2>
        <button type="button" class="drawer__close" (click)="closed.emit()">✕</button>
      </div>
      <form [formGroup]="form" (ngSubmit)="submit()" class="drawer__body">
        <div class="field">
          <label for="activity-subject">Subject *</label>
          <input id="activity-subject" type="text" formControlName="subject"
                 [class.field--error]="form.get('subject')?.invalid && form.get('subject')?.touched" />
          @if (form.get('subject')?.invalid && form.get('subject')?.touched) {
            <span class="field__error">Subject is required</span>
          }
        </div>
        <div class="field">
          <label for="activity-type">Type *</label>
          <select id="activity-type" formControlName="type">
            <option value="CALL">Call</option>
            <option value="EMAIL">Email</option>
            <option value="MEETING">Meeting</option>
            <option value="NOTE">Note</option>
          </select>
        </div>
        <div class="field">
          <label for="activity-notes">Notes</label>
          <textarea id="activity-notes" formControlName="notes" rows="4"></textarea>
        </div>
        <div class="field">
          <label for="activity-occurred-at">Date &amp; Time</label>
          <input id="activity-occurred-at" type="datetime-local" formControlName="occurredAt" />
        </div>
        <div class="drawer__footer">
          <button type="button" class="btn btn--secondary" (click)="closed.emit()">Cancel</button>
          <button type="submit" class="btn btn--primary" [disabled]="submitting">
            {{ submitting ? 'Saving…' : 'Log Activity' }}
          </button>
        </div>
      </form>
    </aside>
  `,
  styles: [`
    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 100; }
    .drawer { position: fixed; top: 0; right: 0; width: 400px; height: 100vh; background: var(--color-surface); z-index: 101; display: flex; flex-direction: column; box-shadow: var(--shadow-lg); }
    .drawer__header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--color-border); }
    .drawer__title { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin: 0; }
    .drawer__close { background: none; border: none; font-size: var(--font-size-lg); cursor: pointer; color: var(--color-text-secondary); }
    .drawer__body { flex: 1; overflow-y: auto; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
    .drawer__footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding-top: var(--space-4); border-top: 1px solid var(--color-border); }
    .field { display: flex; flex-direction: column; gap: var(--space-1); }
    .field--error input { border-color: var(--color-error); }
    .field__error { color: var(--color-error); font-size: var(--font-size-xs); }
  `],
})
export class LogActivityDrawerComponent {
  @Input() contactId?: number;
  @Input() dealId?: number;
  @Output() activityLogged = new EventEmitter<Activity>();
  @Output() closed = new EventEmitter<void>();

  private readonly activityService = inject(ActivityService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  submitting = false;

  form: FormGroup<{
    subject: FormControl<string>;
    type: FormControl<string>;
    notes: FormControl<string>;
    occurredAt: FormControl<string>;
  }> = this.fb.nonNullable.group({
    subject: ['', Validators.required],
    type: ['CALL'],
    notes: [''],
    occurredAt: [new Date().toISOString().slice(0, 16)],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const req: CreateActivityRequest = {
      subject: this.form.value.subject!,
      type: this.form.value.type as CreateActivityRequest['type'],
      notes: this.form.value.notes || undefined,
      occurredAt: this.form.value.occurredAt || undefined,
      contactId: this.contactId,
      dealId: this.dealId,
    };
    this.activityService.createActivity(req).subscribe({
      next: (activity) => {
        this.activityLogged.emit(activity);
        this.submitting = false;
      },
      error: () => {
        this.toastService.add('Failed to log activity', 'error');
        this.submitting = false;
      },
    });
  }
}
