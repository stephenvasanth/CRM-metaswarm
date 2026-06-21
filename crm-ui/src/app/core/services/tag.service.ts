import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TagWithCount {
  id: number;
  name: string;
  colour: string;
  contactCount: number;
}

export interface CreateTagRequest {
  name: string;
  colour: string;
}

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/tags';

  getTags(): Observable<TagWithCount[]> {
    return this.http.get<TagWithCount[]>(this.apiUrl);
  }

  createTag(req: CreateTagRequest): Observable<TagWithCount> {
    return this.http.post<TagWithCount>(this.apiUrl, req);
  }

  deleteTag(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
