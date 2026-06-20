import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DealService, Deal, DealStage, DEAL_STAGES } from '../../../core/services/deal.service';
import { ToastService } from '../../../core/services/toast.service';
import { DealDrawerComponent } from '../deal-drawer/deal-drawer.component';

@Component({
  selector: 'app-deals-board',
  standalone: true,
  imports: [DealDrawerComponent],
  template: `
    <div class="board-page">
      <div class="board-page__header">
        <h1 class="board-page__title">Pipeline</h1>
        <button class="btn btn--primary" (click)="openDrawer(null)">New Deal</button>
      </div>

      @if (loading) {
        <div class="board__loading"><span>Loading pipeline...</span></div>
      } @else {
        <div class="board__columns">
          @for (stage of stages; track stage.key) {
            @let stageDeals = dealsForStage(stage.key);
            <div class="board__column">
              <div class="board__column-header" [style.border-top-color]="stage.colour">
                <span class="board__stage-name">{{ stage.label.toUpperCase() }}</span>
                <span class="board__stage-meta">{{ stageDeals.length }} · {{ formatValue(stageDeals) }}</span>
              </div>
              <div class="board__column-body">
                @for (deal of stageDeals; track deal.id) {
                  <div class="board__card"
                       [class.board__card--closed-lost]="stage.key === 'CLOSED_LOST'"
                       (click)="openDrawer(deal)">
                    <div class="board__card-title">{{ deal.title }}</div>
                    @if (deal.contact) {
                      <div class="board__card-contact">{{ deal.contact.name }}</div>
                    }
                    <div class="board__card-footer">
                      @if (deal.value !== undefined) {
                        <span class="board__card-value">{{ formatDealValue(deal.value) }}</span>
                      }
                      @if (deal.closeDate) {
                        <span class="board__card-date"
                              [class.board__card-date--overdue]="isOverdue(deal.closeDate)">
                          {{ deal.closeDate }}
                        </span>
                      }
                    </div>
                    <select class="board__card-stage"
                            [value]="deal.stage"
                            (change)="onStageChange(deal, $event)"
                            (click)="$event.stopPropagation()">
                      @for (s of stages; track s.key) {
                        <option [value]="s.key">{{ s.label }}</option>
                      }
                    </select>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (showDrawer) {
      <app-deal-drawer
        [deal]="selectedDeal"
        (closed)="onDrawerClosed()"
        (saved)="onDealSaved()">
      </app-deal-drawer>
    }
  `,
  styles: [`
    .board-page { display: flex; flex-direction: column; height: 100%; overflow: hidden; padding: var(--space-6); gap: var(--space-6); }
    .board-page__header { display: flex; align-items: center; justify-content: space-between; }
    .board-page__title { font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); margin: 0; }
    .board__loading { display: flex; align-items: center; justify-content: center; flex: 1; color: var(--color-text-secondary); }
    .board__columns { display: flex; gap: var(--space-4); overflow-x: auto; flex: 1; padding-bottom: var(--space-4); }
    .board__column { flex: 0 0 280px; background: #F1F5F9; border-radius: var(--radius-md); display: flex; flex-direction: column; }
    .board__column-header { padding: var(--space-3) var(--space-4); border-top: 3px solid transparent; border-radius: var(--radius-md) var(--radius-md) 0 0; background: #F1F5F9; }
    .board__stage-name { display: block; font-size: var(--font-size-xs); font-weight: var(--font-weight-semibold); color: var(--color-text-secondary); letter-spacing: 0.05em; }
    .board__stage-meta { display: block; font-size: var(--font-size-sm); color: var(--color-text-secondary); margin-top: var(--space-1); }
    .board__column-body { flex: 1; padding: var(--space-2); display: flex; flex-direction: column; gap: var(--space-2); overflow-y: auto; }
    .board__card { background: var(--color-surface); border-radius: var(--radius-md); padding: var(--space-3); box-shadow: var(--shadow-sm); cursor: pointer; transition: box-shadow 0.15s; }
    .board__card:hover { box-shadow: var(--shadow-md); }
    .board__card--closed-lost { opacity: 0.6; }
    .board__card-title { font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); color: var(--color-text-primary); margin-bottom: var(--space-1); }
    .board__card-contact { font-size: var(--font-size-xs); color: var(--color-text-secondary); margin-bottom: var(--space-2); }
    .board__card-footer { display: flex; justify-content: space-between; align-items: center; }
    .board__card-value { font-size: var(--font-size-xs); font-weight: var(--font-weight-medium); color: var(--color-text-primary); }
    .board__card-date { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
    .board__card-date--overdue { color: var(--color-danger); }
    .board__card-stage { width: 100%; margin-top: var(--space-2); font-size: var(--font-size-xs); border: 1px solid var(--color-border); border-radius: var(--radius-sm); padding: var(--space-1); background: var(--color-surface); cursor: pointer; }
    .btn { padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); font-size: var(--font-size-sm); font-weight: var(--font-weight-medium); cursor: pointer; border: none; }
    .btn--primary { background: var(--color-primary); color: #fff; }
  `]
})
export class DealsBoardComponent implements OnInit, OnDestroy {
  private readonly dealService = inject(DealService);
  private readonly toastService = inject(ToastService);
  private readonly destroy$ = new Subject<void>();

  readonly stages = DEAL_STAGES;
  deals: Deal[] = [];
  loading = false;
  showDrawer = false;
  selectedDeal: Deal | null = null;

  ngOnInit(): void {
    this.loadDeals();
  }

  loadDeals(): void {
    this.loading = true;
    this.dealService.getDeals().pipe(takeUntil(this.destroy$)).subscribe({
      next: deals => {
        this.deals = deals;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.add('Failed to load deals', 'error');
      },
    });
  }

  dealsForStage(stage: DealStage): Deal[] {
    return this.deals.filter(d => d.stage === stage);
  }

  formatValue(deals: Deal[]): string {
    const sum = deals.reduce((acc, d) => acc + (d.value ?? 0), 0);
    if (sum === 0) return '—';
    if (sum >= 1000) return `$${(sum / 1000).toFixed(0)}K`;
    return `$${sum}`;
  }

  formatDealValue(value: number): string {
    return '$' + value.toLocaleString('en-US');
  }

  isOverdue(closeDate: string | undefined): boolean {
    if (!closeDate) return false;
    return new Date(closeDate) < new Date();
  }

  openDrawer(deal: Deal | null): void {
    this.selectedDeal = deal;
    this.showDrawer = true;
  }

  onDrawerClosed(): void {
    this.showDrawer = false;
    this.selectedDeal = null;
  }

  onDealSaved(): void {
    this.showDrawer = false;
    this.selectedDeal = null;
    this.loadDeals();
  }

  onStageChange(deal: Deal, event: Event): void {
    const stage = (event.target as HTMLSelectElement).value as DealStage;
    this.dealService.updateDealStage(deal.id, stage).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.loadDeals(),
      error: () => this.toastService.add('Failed to update stage', 'error'),
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
