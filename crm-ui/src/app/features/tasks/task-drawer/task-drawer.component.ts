import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TaskService, Task, CreateTaskRequest } from '../../../core/services/task.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-task-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="drawer-overlay" (click)="closed.emit()"></div>
    <aside class="drawer">
      <div class="drawer__header">
        <h2 class="drawer__title">{{ task ? 'Edit Task' : 'New Task' }}</h2>
        <button type="button" class="drawer__close" (click)="closed.emit()">✕</button>
      </div>
      <form [formGroup]="form" (ngSubmit)="submit()" class="drawer__body">
        <div class="field">
          <label for="task-title">Title *</label>
          <input id="task-title" type="text" formControlName="title"
                 [class.field--error]="form.get('title')?.invalid && form.get('title')?.touched" />
          @if (form.get('title')?.invalid && form.get('title')?.touched) {
            <span class="field__error">Title is required</span>
          }
        </div>
        <div class="field">
          <label for="task-description">Description</label>
          <textarea id="task-description" formControlName="description" rows="3"></textarea>
        </div>
        <div class="field">
          <label for="task-due-date">Due Date</label>
          <input id="task-due-date" type="date" formControlName="dueDate" />
        </div>
        <div class="drawer__footer">
          <button type="button" class="btn btn--secondary" (click)="closed.emit()">Cancel</button>
          <button type="submit" class="btn btn--primary" [disabled]="submitting">
            {{ submitting ? 'Saving…' : (task ? 'Update' : 'Create') }}
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
export class TaskDrawerComponent implements OnInit {
  @Input() task: Task | null = null;
  @Input() contactId?: number;
  @Input() dealId?: number;
  @Output() taskSaved = new EventEmitter<Task>();
  @Output() closed = new EventEmitter<void>();

  private readonly taskService = inject(TaskService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  submitting = false;

  form: FormGroup<{
    title: FormControl<string>;
    description: FormControl<string>;
    dueDate: FormControl<string>;
  }> = this.fb.nonNullable.group({
    title: ['', Validators.required],
    description: [''],
    dueDate: [''],
  });

  ngOnInit(): void {
    if (this.task) {
      this.form.patchValue({
        title: this.task.title,
        description: this.task.description ?? '',
        dueDate: this.task.dueDate ?? '',
      });
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const req: CreateTaskRequest = {
      title: this.form.value.title!,
      description: this.form.value.description || undefined,
      dueDate: this.form.value.dueDate || undefined,
      contactId: this.task ? this.task.contactId : this.contactId,
      dealId: this.task ? this.task.dealId : this.dealId,
    };

    const call = this.task
      ? this.taskService.updateTask(this.task.id, req)
      : this.taskService.createTask(req);

    call.subscribe({
      next: (saved) => {
        this.taskSaved.emit(saved);
        this.submitting = false;
      },
      error: () => {
        this.toastService.add('Failed to save task', 'error');
        this.submitting = false;
      },
    });
  }
}
