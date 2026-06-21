import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Activity {
  id: number;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';
  subject: string;
  notes?: string;
  occurredAt: string;
  contactId?: number;
  contactName?: string;
  dealId?: number;
  dealTitle?: string;
  authorId?: number;
  authorName?: string;
  createdAt: string;
}

export interface CreateActivityRequest {
  subject: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'NOTE';
  notes?: string;
  occurredAt?: string;
  contactId?: number;
  dealId?: number;
  authorId?: number;
}

export interface ActivityPage {
  content: Activity[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly http = inject(HttpClient);

  getActivities(page = 0, size = 20): Observable<ActivityPage> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    return this.http.get<ActivityPage>('/api/activities', { params });
  }

  getByContact(contactId: number): Observable<Activity[]> {
    return this.http.get<Activity[]>(`/api/contacts/${contactId}/activities`);
  }

  getByDeal(dealId: number): Observable<Activity[]> {
    return this.http.get<Activity[]>(`/api/deals/${dealId}/activities`);
  }

  createActivity(req: CreateActivityRequest): Observable<Activity> {
    return this.http.post<Activity>('/api/activities', req);
  }

  deleteActivity(id: number): Observable<void> {
    return this.http.delete<void>(`/api/activities/${id}`);
  }
}
