import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="overlay" (click)="onOverlayClick($event)" role="dialog" aria-modal="true" [attr.aria-labelledby]="'dialog-title-' + instanceId">
      <div class="dialog">
        <h2 class="dialog__title" [id]="'dialog-title-' + instanceId">{{ title }}</h2>
        <p class="dialog__message">{{ message }}</p>
        <div class="dialog__actions">
          <button
            class="dialog__btn dialog__btn--cancel"
            (click)="confirmed.emit(false)"
            type="button"
          >
            {{ cancelLabel }}
          </button>
          <button
            class="dialog__btn dialog__btn--confirm"
            (click)="confirmed.emit(true)"
            type="button"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }

    .dialog {
      background-color: var(--color-surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: var(--space-6);
      max-width: 400px;
      width: 100%;
      margin: var(--space-4);
    }

    .dialog__title {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin-bottom: var(--space-3);
    }

    .dialog__message {
      font-size: var(--font-size-base);
      color: var(--color-text-secondary);
      margin-bottom: var(--space-6);
    }

    .dialog__actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
    }

    .dialog__btn {
      padding: var(--space-2) var(--space-5);
      border-radius: var(--radius-md);
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      border: 1px solid transparent;
      transition: background-color 150ms ease;
    }

    .dialog__btn--cancel {
      background-color: var(--color-surface);
      border-color: var(--color-border);
      color: var(--color-text-primary);
    }

    .dialog__btn--cancel:hover {
      background-color: var(--color-background);
    }

    .dialog__btn--confirm {
      background-color: var(--color-danger);
      color: var(--color-surface);
    }

    .dialog__btn--confirm:hover {
      background-color: #DC2626;
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';
  @Input() confirmLabel = 'Delete';
  @Input() cancelLabel = 'Cancel';
  @Output() confirmed = new EventEmitter<boolean>();

  readonly instanceId = Math.random().toString(36).slice(2);

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.confirmed.emit(false);
    }
  }
}
