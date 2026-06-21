import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardData, DealStageStats } from '../../core/services/dashboard.service';

const STAGE_LABELS: Record<string, string> = {
  LEAD: 'Lead',
  QUALIFIED: 'Qualified',
  PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation',
  CLOSED_WON: 'Closed Won',
  CLOSED_LOST: 'Closed Lost',
};

const STAGE_COLOURS: Record<string, string> = {
  LEAD: 'var(--color-primary)',
  QUALIFIED: 'var(--color-info)',
  PROPOSAL: 'var(--color-warning)',
  NEGOTIATION: '#8B5CF6',
  CLOSED_WON: 'var(--color-success)',
  CLOSED_LOST: 'var(--color-danger)',
};

const ACTIVITY_COLOURS: Record<string, string> = {
  CALL: 'var(--color-info)',
  EMAIL: '#8B5CF6',
  MEETING: 'var(--color-success)',
  NOTE: 'var(--color-text-secondary)',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  template: `
    @if (loading) {
      <div class="dashboard-loading" aria-live="polite" aria-busy="true">
        <p>Loading dashboard…</p>
      </div>
    } @else if (data) {
      <div class="dashboard">
        <div class="dashboard__header">
          <h1 class="dashboard__title">Dashboard</h1>
        </div>

        <!-- Metric cards -->
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-card__icon metric-card__icon--deals">💼</div>
            <div class="metric-card__body">
              <span class="metric-card__value">{{ data.openDealsCount }}</span>
              <span class="metric-card__label">Open Deals</span>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-card__icon metric-card__icon--value">£</div>
            <div class="metric-card__body">
              <span class="metric-card__value">{{ data.pipelineValue | currency:'GBP':'symbol':'1.0-0' }}</span>
              <span class="metric-card__label">Pipeline Value</span>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-card__icon metric-card__icon--tasks">✓</div>
            <div class="metric-card__body">
              <span class="metric-card__value">{{ data.tasksDueToday }}</span>
              <span class="metric-card__label">Tasks Due Today</span>
            </div>
          </div>
          <div class="metric-card">
            <div class="metric-card__icon metric-card__icon--contacts">👤</div>
            <div class="metric-card__body">
              <span class="metric-card__value">{{ data.newContactsLast7Days }}</span>
              <span class="metric-card__label">New Contacts (7d)</span>
            </div>
          </div>
        </div>

        <!-- Pipeline chart -->
        @if (data.dealsByStage.length > 0) {
          <div class="pipeline-chart card">
            <h2 class="card__heading">Pipeline by Stage</h2>
            <div class="pipeline-chart__bars">
              @for (stat of data.dealsByStage; track stat.stage) {
                <div class="pipeline-bar">
                  <div class="pipeline-bar__label">{{ stageLabel(stat.stage) }}</div>
                  <div class="pipeline-bar__track">
                    <div
                      class="pipeline-bar__fill"
                      [style.width]="barWidth(stat) + '%'"
                      [style.background]="stageColour(stat.stage)"
                    ></div>
                  </div>
                  <div class="pipeline-bar__meta">
                    <span class="pipeline-bar__count">{{ stat.count }}</span>
                    <span class="pipeline-bar__value">{{ stat.totalValue | currency:'GBP':'symbol':'1.0-0' }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Bottom row -->
        <div class="dashboard__bottom">
          <!-- My Tasks widget -->
          <div class="card tasks-widget">
            <div class="card__header">
              <h2 class="card__heading">Upcoming Tasks</h2>
              <a routerLink="/tasks" class="card__link">View all</a>
            </div>
            @if (data.upcomingTasks.length === 0) {
              <p class="empty-state">No upcoming tasks. Great work!</p>
            } @else {
              <ul class="task-list">
                @for (task of data.upcomingTasks; track task.id) {
                  <li class="task-list__item">
                    <span class="task-list__title">{{ task.title }}</span>
                    @if (task.dueDate) {
                      <span
                        class="task-list__due"
                        [class.task-list__due--overdue]="isOverdue(task.dueDate)"
                        [class.task-list__due--today]="isToday(task.dueDate)"
                      >{{ task.dueDate | date:'mediumDate' }}</span>
                    }
                  </li>
                }
              </ul>
            }
          </div>

          <!-- Recent activity feed -->
          <div class="card activity-feed">
            <div class="card__header">
              <h2 class="card__heading">Recent Activities</h2>
            </div>
            @if (data.recentActivities.length === 0) {
              <p class="empty-state">No recent activities.</p>
            } @else {
              <ul class="activity-list">
                @for (activity of data.recentActivities; track activity.id) {
                  <li class="activity-list__item">
                    <span
                      class="activity-list__type-dot"
                      [style.background]="activityColour(activity.type)"
                    ></span>
                    <div class="activity-list__body">
                      <span class="activity-list__subject">{{ activity.subject }}</span>
                      @if (activity.contactName) {
                        <span class="activity-list__contact">{{ activity.contactName }}</span>
                      }
                    </div>
                    <span class="activity-list__time">{{ activity.occurredAt | date:'shortDate' }}</span>
                  </li>
                }
              </ul>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .dashboard-loading { padding: var(--space-12); text-align: center; color: var(--color-text-secondary); }

    .dashboard { padding: var(--space-6); max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-6); }

    .dashboard__header { display: flex; align-items: center; justify-content: space-between; }

    .dashboard__title { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); margin: 0; }

    /* Metric cards */
    .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }

    .metric-card { background: var(--color-surface); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); padding: var(--space-5); display: flex; align-items: center; gap: var(--space-4); }

    .metric-card__icon { width: 48px; height: 48px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }

    .metric-card__icon--deals { background: var(--color-primary-light); }
    .metric-card__icon--value { background: #EEF9F5; color: var(--color-success); font-weight: var(--font-weight-bold); font-size: var(--font-size-lg); }
    .metric-card__icon--tasks { background: #FFF7ED; color: var(--color-warning); }
    .metric-card__icon--contacts { background: #EFF6FF; color: var(--color-info); }

    .metric-card__body { display: flex; flex-direction: column; gap: var(--space-1); }

    .metric-card__value { font-size: var(--font-size-xl); font-weight: var(--font-weight-bold); color: var(--color-text-primary); line-height: 1; }

    .metric-card__label { font-size: var(--font-size-sm); color: var(--color-text-secondary); }

    /* Card base */
    .card { background: var(--color-surface); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); padding: var(--space-5); }

    .card__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); }

    .card__heading { font-size: var(--font-size-base); font-weight: var(--font-weight-semibold); color: var(--color-text-primary); margin: 0; }

    .card__link { font-size: var(--font-size-sm); color: var(--color-primary); text-decoration: none; }
    .card__link:hover { text-decoration: underline; }

    /* Pipeline chart */
    .pipeline-chart__bars { display: flex; flex-direction: column; gap: var(--space-3); }

    .pipeline-bar { display: grid; grid-template-columns: 100px 1fr 160px; gap: var(--space-3); align-items: center; }

    .pipeline-bar__label { font-size: var(--font-size-sm); color: var(--color-text-secondary); text-align: right; }

    .pipeline-bar__track { height: 20px; background: var(--color-background); border-radius: var(--radius-full); overflow: hidden; }

    .pipeline-bar__fill { height: 100%; border-radius: var(--radius-full); transition: width 400ms ease; min-width: 4px; }

    .pipeline-bar__meta { display: flex; gap: var(--space-3); font-size: var(--font-size-sm); }

    .pipeline-bar__count { color: var(--color-text-primary); font-weight: var(--font-weight-medium); width: 24px; }

    .pipeline-bar__value { color: var(--color-text-secondary); }

    /* Bottom row */
    .dashboard__bottom { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); }

    /* Tasks widget */
    .task-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-2); }

    .task-list__item { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border); }

    .task-list__item:last-child { border-bottom: none; }

    .task-list__title { font-size: var(--font-size-sm); color: var(--color-text-primary); flex: 1; }

    .task-list__due { font-size: var(--font-size-xs); padding: 2px var(--space-2); border-radius: var(--radius-sm); background: var(--color-background); color: var(--color-text-secondary); }

    .task-list__due--today { background: #FFF7ED; color: var(--color-warning); }

    .task-list__due--overdue { background: #FEF2F2; color: var(--color-danger); }

    /* Activity feed */
    .activity-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0; }

    .activity-list__item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border); }

    .activity-list__item:last-child { border-bottom: none; }

    .activity-list__type-dot { width: 8px; height: 8px; border-radius: var(--radius-full); flex-shrink: 0; }

    .activity-list__body { flex: 1; display: flex; flex-direction: column; gap: 2px; }

    .activity-list__subject { font-size: var(--font-size-sm); color: var(--color-text-primary); font-weight: var(--font-weight-medium); }

    .activity-list__contact { font-size: var(--font-size-xs); color: var(--color-text-secondary); }

    .activity-list__time { font-size: var(--font-size-xs); color: var(--color-text-secondary); white-space: nowrap; }

    .empty-state { font-size: var(--font-size-sm); color: var(--color-text-secondary); text-align: center; padding: var(--space-6) 0; margin: 0; }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);

  data: DashboardData | null = null;
  loading = false;
  private maxBarCount = 0;

  ngOnInit(): void {
    this.loading = true;
    this.dashboardService.getDashboard().subscribe({
      next: (data) => {
        this.data = data;
        this.maxBarCount = data.dealsByStage.reduce((max, s) => Math.max(max, s.count), 0);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  barWidth(stat: DealStageStats): number {
    if (this.maxBarCount === 0) return 0;
    return Math.round((stat.count / this.maxBarCount) * 100);
  }

  stageLabel(stage: string): string {
    return STAGE_LABELS[stage] ?? stage;
  }

  stageColour(stage: string): string {
    return STAGE_COLOURS[stage] ?? 'var(--color-primary)';
  }

  activityColour(type: string): string {
    return ACTIVITY_COLOURS[type] ?? 'var(--color-text-secondary)';
  }

  isOverdue(dueDate: string): boolean {
    const [y, m, d] = dueDate.split('-').map(Number);
    const due = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  }

  isToday(dueDate: string): boolean {
    const [y, m, d] = dueDate.split('-').map(Number);
    const today = new Date();
    return y === today.getFullYear() && m === today.getMonth() + 1 && d === today.getDate();
  }
}
