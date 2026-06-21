import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TagService, TagWithCount, CreateTagRequest } from '../../../core/services/tag.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-tags',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="tags-admin">
      <h1 class="tags-admin__title">Tags</h1>

      @if (loading) {
        <p class="tags-admin__loading">Loading tags…</p>
      } @else {
        <table class="tags-table" aria-label="Tags">
          <thead>
            <tr>
              <th>Colour</th>
              <th>Name</th>
              <th>Contacts</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (tag of tags; track tag.id) {
              <tr>
                <td>
                  <span class="colour-swatch" [style.background]="tag.colour"></span>
                </td>
                <td>{{ tag.name }}</td>
                <td>{{ tag.contactCount }}</td>
                <td>
                  @if (pendingDeleteId === tag.id) {
                    <span class="confirm-delete">
                      Delete?
                      <button type="button" class="btn btn--danger btn--sm" (click)="confirmDelete(tag.id)">Yes</button>
                      <button type="button" class="btn btn--secondary btn--sm" (click)="cancelDelete()">No</button>
                    </span>
                  } @else {
                    <button type="button" class="btn btn--ghost btn--sm" (click)="requestDelete(tag.id)">Delete</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>

        <form [formGroup]="form" (ngSubmit)="addTag()" class="new-tag-form">
          <h2 class="new-tag-form__title">New Tag</h2>
          <div class="new-tag-form__fields">
            <div class="field">
              <label for="tag-name">Name</label>
              <input id="tag-name" type="text" formControlName="name"
                     [class.field--error]="form.get('name')?.invalid && form.get('name')?.touched" />
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <span class="field__error">Name is required</span>
              }
            </div>
            <div class="field">
              <label for="tag-colour">Colour</label>
              <input id="tag-colour" type="color" formControlName="colour" />
            </div>
            <button type="submit" class="btn btn--primary" [disabled]="submitting">
              {{ submitting ? 'Adding…' : 'Add Tag' }}
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .tags-admin { padding: var(--space-6); }
    .tags-admin__title { margin-bottom: var(--space-6); }
    .tags-admin__loading { color: var(--color-text-secondary); }
    .tags-table { width: 100%; border-collapse: collapse; margin-bottom: var(--space-8); }
    .tags-table th, .tags-table td {
      padding: var(--space-3) var(--space-4);
      text-align: left;
      border-bottom: 1px solid var(--color-border);
    }
    .colour-swatch { display: inline-block; width: 16px; height: 16px; border-radius: 3px; }
    .confirm-delete { display: flex; align-items: center; gap: var(--space-2); font-size: var(--font-size-sm); }
    .new-tag-form { border-top: 1px solid var(--color-border); padding-top: var(--space-6); }
    .new-tag-form__title { margin-bottom: var(--space-4); font-size: var(--font-size-lg); }
    .new-tag-form__fields { display: flex; align-items: flex-end; gap: var(--space-4); flex-wrap: wrap; }
    .field { display: flex; flex-direction: column; gap: var(--space-1); }
    .field--error input { border-color: var(--color-error); }
    .field__error { color: var(--color-error); font-size: var(--font-size-xs); }
    .btn--sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-sm); }
    .btn--ghost { background: none; border: 1px solid var(--color-border); color: var(--color-text-secondary); cursor: pointer; border-radius: var(--radius-sm); }
  `],
})
export class TagsComponent implements OnInit {
  private readonly tagService = inject(TagService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  tags: TagWithCount[] = [];
  loading = false;
  submitting = false;
  pendingDeleteId: number | null = null;

  form: FormGroup<{ name: FormControl<string>; colour: FormControl<string> }> =
    this.fb.nonNullable.group({
      name: ['', Validators.required],
      colour: ['#6366F1'],
    });

  ngOnInit(): void {
    this.loadTags();
  }

  loadTags(): void {
    this.loading = true;
    this.tagService.getTags().subscribe({
      next: (tags) => {
        this.tags = tags;
        this.loading = false;
      },
      error: () => {
        this.toastService.add('Failed to load tags', 'error');
        this.loading = false;
      },
    });
  }

  requestDelete(id: number): void {
    this.pendingDeleteId = id;
  }

  cancelDelete(): void {
    this.pendingDeleteId = null;
  }

  confirmDelete(id: number): void {
    this.pendingDeleteId = null;
    this.tagService.deleteTag(id).subscribe({
      next: () => {
        this.toastService.add('Tag deleted', 'success');
        this.loadTags();
      },
      error: () => this.toastService.add('Failed to delete tag', 'error'),
    });
  }

  addTag(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const req: CreateTagRequest = {
      name: this.form.value.name!,
      colour: this.form.value.colour!,
    };
    this.tagService.createTag(req).subscribe({
      next: () => {
        this.toastService.add('Tag created', 'success');
        this.form.reset({ name: '', colour: '#6366F1' });
        this.submitting = false;
        this.loadTags();
      },
      error: () => {
        this.toastService.add('Failed to create tag', 'error');
        this.submitting = false;
      },
    });
  }
}
