import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts$ = new BehaviorSubject<Toast[]>([]);
  readonly toasts$ = this._toasts$.asObservable();

  add(message: string, type: Toast['type'] = 'info'): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const toast: Toast = { id, message, type };

    const current = this._toasts$.getValue();
    // Enforce max 3 — remove oldest if at limit
    const updated =
      current.length >= MAX_TOASTS
        ? [...current.slice(1), toast]
        : [...current, toast];

    this._toasts$.next(updated);

    setTimeout(() => this.remove(id), AUTO_DISMISS_MS);
  }

  remove(id: string): void {
    const current = this._toasts$.getValue();
    this._toasts$.next(current.filter((t) => t.id !== id));
  }
}
