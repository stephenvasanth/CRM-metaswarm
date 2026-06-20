import { Component, Input } from '@angular/core';
import { Tag } from '../../../core/services/contact.service';

@Component({
  selector: 'app-tag-chip',
  standalone: true,
  template: `
    <span
      class="tag-chip"
      [style.background-color]="tag.colour"
      [style.color]="textColor"
    >{{ tag.name }}</span>
  `,
  styles: [`
    .tag-chip {
      display: inline-flex;
      align-items: center;
      padding: 2px var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-medium);
      white-space: nowrap;
    }
  `],
})
export class TagChipComponent {
  @Input({ required: true }) tag!: Tag;

  get textColor(): string {
    return this.getContrastColor(this.tag.colour);
  }

  private getContrastColor(hex: string): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#1E293B' : '#FFFFFF';
  }
}
