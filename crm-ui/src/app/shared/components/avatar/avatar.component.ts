import { Component, Input, OnChanges } from '@angular/core';

// Design-token-aligned avatar colors (using design token hex values directly,
// as CSS custom properties cannot be computed dynamically in TS)
const AVATAR_COLORS = [
  '#4F46E5', // --color-primary
  '#10B981', // --color-success
  '#3B82F6', // --color-info
  '#F59E0B', // --color-warning
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316'  // orange
];

@Component({
  selector: 'app-avatar',
  standalone: true,
  template: `
    <span
      class="avatar"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.background-color]="bgColor"
      [style.font-size.px]="fontSize"
      [attr.aria-label]="name"
      role="img"
    >
      {{ initials }}
    </span>
  `,
  styles: [`
    .avatar {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-full);
      color: #FFFFFF;
      font-weight: var(--font-weight-semibold);
      flex-shrink: 0;
      user-select: none;
    }
  `]
})
export class AvatarComponent implements OnChanges {
  @Input() name = '';
  @Input() size = 32;

  initials = '';
  bgColor = '';
  fontSize = 12;

  ngOnChanges(): void {
    this.initials = this.getInitials(this.name);
    this.bgColor = this.getColor(this.name);
    this.fontSize = Math.round(this.size * 0.38);
  }

  private getInitials(name: string): string {
    const words = name.trim().split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0][0].toUpperCase();
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  private getColor(name: string): string {
    const hash = name
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATAR_COLORS[hash % AVATAR_COLORS.length];
  }
}
