import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    <span
      class="skeleton"
      [style.width]="width"
      [style.height]="height"
      role="status"
      aria-label="Loading..."
    ></span>
  `,
  styles: [`
    .skeleton {
      display: inline-block;
      background: linear-gradient(
        90deg,
        var(--color-border) 25%,
        var(--color-background) 50%,
        var(--color-border) 75%
      );
      background-size: 200% 100%;
      border-radius: var(--radius-sm);
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `]
})
export class SkeletonComponent {
  @Input() width = '100%';
  @Input() height = '16px';
}
