import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type DealStage = 'LEAD' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';

export interface DealContact {
  id: string;
  name: string;
}

export interface DealOwner {
  id: string;
  name: string;
  email: string;
}

export interface Deal {
  id: string;
  title: string;
  value?: number;
  stage: DealStage;
  closeDate?: string;
  contact?: DealContact;
  owner?: DealOwner;
  notes?: string;
  createdAt: string;
}

export interface CreateDealRequest {
  title: string;
  value?: number;
  stage: DealStage;
  closeDate?: string;
  contactId?: string;
  notes?: string;
}

export const DEAL_STAGES: { key: DealStage; label: string; colour: string }[] = [
  { key: 'LEAD', label: 'Lead', colour: '#94A3B8' },
  { key: 'QUALIFIED', label: 'Qualified', colour: '#3B82F6' },
  { key: 'PROPOSAL', label: 'Proposal', colour: '#8B5CF6' },
  { key: 'NEGOTIATION', label: 'Negotiation', colour: '#F59E0B' },
  { key: 'CLOSED_WON', label: 'Closed Won', colour: '#10B981' },
  { key: 'CLOSED_LOST', label: 'Closed Lost', colour: '#EF4444' },
];

@Injectable({ providedIn: 'root' })
export class DealService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/deals';

  getDeals(): Observable<Deal[]> {
    return this.http.get<Deal[]>(this.apiUrl);
  }

  getDeal(id: string): Observable<Deal> {
    return this.http.get<Deal>(`${this.apiUrl}/${id}`);
  }

  createDeal(req: CreateDealRequest): Observable<Deal> {
    return this.http.post<Deal>(this.apiUrl, req);
  }

  updateDeal(id: string, req: CreateDealRequest): Observable<Deal> {
    return this.http.put<Deal>(`${this.apiUrl}/${id}`, req);
  }

  updateDealStage(id: string, stage: DealStage): Observable<Deal> {
    return this.http.patch<Deal>(`${this.apiUrl}/${id}/stage`, { stage });
  }

  deleteDeal(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
