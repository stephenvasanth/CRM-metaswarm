import { Component, Input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Activity } from '../../../core/services/activity.service';

const TYPE_COLOURS: Record<string, string> = {
  CALL: '#3B82F6',
  EMAIL: '#8B5CF6',
  MEETING: '#10B981',
  NOTE: '#94A3B8',
};

@Component({
  selector: 'app-activity-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="activity-card">
      <span class="activity-card__dot" [style.background]="typeColour"></span>
      <div class="activity-card__body">
        <div class="activity-card__subject">{{ activity.subject }}</div>
        @if (activity.notes) {
          <div class="activity-card__notes">{{ activity.notes }}</div>
        }
        <div class="activity-card__meta">
          @if (activity.authorName) {
            <span>{{ activity.authorName }}</span>
          }
          <span>{{ activity.occurredAt | date:'mediumDate' }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .activity-card { display: flex; gap: var(--space-3); padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border); }
    .activity-card__dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
    .activity-card__body { flex: 1; }
    .activity-card__subject { font-weight: var(--font-weight-medium); }
    .activity-card__notes { font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: var(--space-1); }
    .activity-card__meta { display: flex; gap: var(--space-3); font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-top: var(--space-1); }
  `],
})
export class ActivityCardComponent {
  @Input() activity!: Activity;

  get typeColour(): string {
    return TYPE_COLOURS[this.activity.type] ?? '#94A3B8';
  }
}
