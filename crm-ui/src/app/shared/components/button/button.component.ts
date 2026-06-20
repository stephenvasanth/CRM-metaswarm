import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgClass],
  template: `
    <button
      [ngClass]="['btn', 'btn--' + variant, 'btn--' + size]"
      [disabled]="disabled || loading"
      [attr.aria-busy]="loading"
      type="button"
    >
      @if (loading) {
        <span class="btn__spinner" aria-hidden="true"></span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      border-radius: var(--radius-md);
      font-family: var(--font-family);
      font-weight: var(--font-weight-medium);
      cursor: pointer;
      border: 1px solid transparent;
      transition: background-color 150ms ease, border-color 150ms ease, opacity 150ms ease;
      white-space: nowrap;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Sizes */
    .btn--sm {
      padding: var(--space-1) var(--space-3);
      font-size: var(--font-size-sm);
    }

    .btn--md {
      padding: var(--space-2) var(--space-4);
      font-size: var(--font-size-base);
    }

    .btn--lg {
      padding: var(--space-3) var(--space-6);
      font-size: var(--font-size-md);
    }

    /* Variants */
    .btn--primary {
      background-color: var(--color-primary);
      color: var(--color-surface);
      border-color: var(--color-primary);
    }

    .btn--primary:hover:not(:disabled) {
      background-color: var(--color-primary-dark);
      border-color: var(--color-primary-dark);
    }

    .btn--secondary {
      background-color: var(--color-surface);
      color: var(--color-text-primary);
      border-color: var(--color-border);
    }

    .btn--secondary:hover:not(:disabled) {
      background-color: var(--color-background);
    }

    .btn--danger {
      background-color: var(--color-danger);
      color: var(--color-surface);
      border-color: var(--color-danger);
    }

    .btn--danger:hover:not(:disabled) {
      background-color: #DC2626;
      border-color: #DC2626;
    }

    .btn--ghost {
      background-color: transparent;
      color: var(--color-text-secondary);
      border-color: transparent;
    }

    .btn--ghost:hover:not(:disabled) {
      background-color: var(--color-background);
      color: var(--color-text-primary);
    }

    /* Spinner */
    .btn__spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: currentColor;
      border-radius: var(--radius-full);
      animation: spin 600ms linear infinite;
    }

    .btn--secondary .btn__spinner,
    .btn--ghost .btn__spinner {
      border-color: rgba(0, 0, 0, 0.15);
      border-top-color: var(--color-text-secondary);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() loading = false;
  @Input() disabled = false;
}
