import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  email: string;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  company?: Company;
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
  tagId?: string;
}

export interface CreateContactRequest {
  name: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  companyId?: string;
  tagIds: string[];
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/contacts';

  getContacts(params: ContactParams = {}): Observable<ContactPage> {
    let httpParams = new HttpParams();
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params.size !== undefined) httpParams = httpParams.set('size', String(params.size));
    if (params.tagId) httpParams = httpParams.set('tagId', params.tagId);
    return this.http.get<ContactPage>(this.apiUrl, { params: httpParams });
  }

  getContact(id: string): Observable<Contact> {
    return this.http.get<Contact>(`${this.apiUrl}/${id}`);
  }

  createContact(req: CreateContactRequest): Observable<Contact> {
    return this.http.post<Contact>(this.apiUrl, req);
  }

  updateContact(id: string, req: CreateContactRequest): Observable<Contact> {
    return this.http.put<Contact>(`${this.apiUrl}/${id}`, req);
  }

  deleteContact(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
