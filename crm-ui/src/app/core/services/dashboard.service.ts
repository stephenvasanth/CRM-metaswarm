import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DealStageStats {
  stage: string;
  count: number;
  totalValue: number;
}

export interface DashboardActivity {
  id: number;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';
  subject: string;
  notes?: string;
  occurredAt?: string;
  contactId?: number;
  contactName?: string;
  dealId?: number;
  dealTitle?: string;
  authorId?: number;
  authorName?: string;
  createdAt: string;
}

export interface DashboardTask {
  id: number;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  assigneeId?: number;
  assigneeName?: string;
  contactId?: number;
  contactName?: string;
  dealId?: number;
  dealTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  openDealsCount: number;
  pipelineValue: number;
  tasksDueToday: number;
  newContactsLast7Days: number;
  dealsByStage: DealStageStats[];
  recentActivities: DashboardActivity[];
  upcomingTasks: DashboardTask[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  getDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>('/api/dashboard');
  }
}
