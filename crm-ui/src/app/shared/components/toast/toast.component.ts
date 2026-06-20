import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div class="toast-container" role="region" aria-live="polite" aria-label="Notifications">
      @for (toast of toastService.toasts$ | async; track toast.id) {
        <div
          class="toast"
          [class]="'toast toast--' + toast.type"
          role="alert"
        >
          <span class="toast__message">{{ toast.message }}</span>
          <button
            class="toast__close"
            (click)="toastService.remove(toast.id)"
            aria-label="Close notification"
          >
            &times;
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: var(--space-4);
      right: var(--space-4);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      max-width: 360px;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      background-color: var(--color-surface);
      box-shadow: var(--shadow-md);
      border-left: 4px solid;
      font-size: var(--font-size-sm);
      color: var(--color-text-primary);
      animation: toast-slide-in 200ms ease-out;
    }

    .toast--success {
      border-left-color: var(--color-success);
    }

    .toast--error {
      border-left-color: var(--color-danger);
    }

    .toast--info {
      border-left-color: var(--color-info);
    }

    .toast__message {
      flex: 1;
    }

    .toast__close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: var(--font-size-lg);
      line-height: 1;
      color: var(--color-text-secondary);
      padding: 0;
      flex-shrink: 0;
    }

    .toast__close:hover {
      color: var(--color-text-primary);
    }

    @keyframes toast-slide-in {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `]
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  trackToast(_index: number, toast: Toast): string {
    return toast.id;
  }
}
