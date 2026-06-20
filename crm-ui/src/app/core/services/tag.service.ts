import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tag } from './contact.service';

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly http = inject(HttpClient);

  getTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>('/api/tags');
  }
}
