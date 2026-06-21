import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityService, Activity } from '../../../core/services/activity.service';
import { ToastService } from '../../../core/services/toast.service';
import { ActivityCardComponent } from '../activity-card/activity-card.component';
import { LogActivityDrawerComponent } from '../log-activity-drawer/log-activity-drawer.component';

@Component({
  selector: 'app-activities-feed',
  standalone: true,
  imports: [CommonModule, ActivityCardComponent, LogActivityDrawerComponent],
  template: `
    <div class="activities-feed">
      <div class="activities-feed__header">
        <h3 class="activities-feed__title">Activities</h3>
        <button type="button" class="btn btn--primary btn--sm" (click)="openDrawer()">
          Log Activity
        </button>
      </div>

      @if (loading) {
        <p class="activities-feed__loading">Loading activities…</p>
      } @else if (activities.length === 0) {
        <p class="activities-feed__empty">No activities yet. Log the first one!</p>
      } @else {
        <div class="activities-feed__list">
          @for (activity of activities; track activity.id) {
            <app-activity-card [activity]="activity" />
          }
        </div>
      }

      @if (showDrawer) {
        <app-log-activity-drawer
          [contactId]="contactId"
          [dealId]="dealId"
          (activityLogged)="onActivityLogged($event)"
          (closed)="closeDrawer()"
        />
      }
    </div>
  `,
  styles: [`
    .activities-feed__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-4);
    }
    .activities-feed__title { font-size: var(--font-size-base); font-weight: var(--font-weight-medium); margin: 0; }
    .activities-feed__loading, .activities-feed__empty { color: var(--color-text-secondary); font-size: var(--font-size-sm); }
    .activities-feed__list { display: flex; flex-direction: column; gap: var(--space-3); }
    .btn--sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-sm); }
  `],
})
export class ActivitiesFeedComponent implements OnInit {
  @Input() contactId?: number;
  @Input() dealId?: number;

  private readonly activityService = inject(ActivityService);
  private readonly toastService = inject(ToastService);

  activities: Activity[] = [];
  loading = false;
  showDrawer = false;

  ngOnInit(): void {
    this.loadActivities();
  }

  loadActivities(): void {
    this.loading = true;
    const obs = this.contactId !== undefined
      ? this.activityService.getByContact(this.contactId)
      : this.dealId !== undefined
        ? this.activityService.getByDeal(this.dealId)
        : null;

    if (!obs) {
      this.loading = false;
      return;
    }

    obs.subscribe({
      next: (activities) => {
        this.activities = activities;
        this.loading = false;
      },
      error: () => {
        this.toastService.add('Failed to load activities', 'error');
        this.loading = false;
      },
    });
  }

  openDrawer(): void {
    this.showDrawer = true;
  }

  closeDrawer(): void {
    this.showDrawer = false;
  }

  onActivityLogged(activity: Activity): void {
    this.activities = [activity, ...this.activities];
    this.showDrawer = false;
  }
}
