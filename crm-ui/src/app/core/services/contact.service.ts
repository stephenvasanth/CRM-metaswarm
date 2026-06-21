import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Tag {
  id: string;
  name: string;
  colour: string;
}

export interface Company {
  id: string;
  name: string;
}

export interface ContactOwner {
  id: string;
  name: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  companyId?: number;
  companyName?: string;
  company?: Company;
  ownerId?: number;
  ownerName?: string;
  owner?: ContactOwner;
  tags: Tag[];
  createdAt: string;
}

export interface ContactPage {
  content: Contact[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ContactParams {
  search?: string;
  page?: number;
  size?: number;
  tagId?: string | number;
}

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  companyId?: number;
  tagIds: number[];
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/contacts';

  private toContact(raw: any): Contact {
    const c: Contact = {
      id: String(raw.id),
      firstName: raw.firstName ?? '',
      lastName: raw.lastName ?? '',
      name: `${raw.firstName ?? ''} ${raw.lastName ?? ''}`.trim(),
      email: raw.email ?? '',
      tags: (raw.tags ?? []).map((t: any) => ({
        id: String(t.id),
        name: t.name,
        colour: t.colour,
      })),
      createdAt: raw.createdAt,
    };
    if (raw.phone) c.phone = raw.phone;
    if (raw.jobTitle) c.jobTitle = raw.jobTitle;
    if (raw.companyId != null) {
      c.companyId = raw.companyId;
      c.companyName = raw.companyName;
      c.company = { id: String(raw.companyId), name: raw.companyName ?? '' };
    }
    if (raw.ownerId != null) {
      c.ownerId = raw.ownerId;
      c.ownerName = raw.ownerName;
      c.owner = { id: String(raw.ownerId), name: raw.ownerName ?? '' };
    }
    return c;
  }

  getContacts(params: ContactParams = {}): Observable<ContactPage> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params.size !== undefined) httpParams = httpParams.set('size', String(params.size));
    if (params.tagId) httpParams = httpParams.set('tagId', String(params.tagId));
    return this.http.get<any>(this.apiUrl, { params: httpParams }).pipe(
      map(page => ({
        ...page,
        content: (page.content ?? []).map((c: any) => this.toContact(c)),
      }))
    );
  }

  getContact(id: string): Observable<Contact> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(raw => this.toContact(raw))
    );
  }

  createContact(req: CreateContactRequest): Observable<Contact> {
    return this.http.post<any>(this.apiUrl, req).pipe(
      map(raw => this.toContact(raw))
    );
  }

  updateContact(id: string, req: CreateContactRequest): Observable<Contact> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, req).pipe(
      map(raw => this.toContact(raw))
    );
  }

  deleteContact(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
