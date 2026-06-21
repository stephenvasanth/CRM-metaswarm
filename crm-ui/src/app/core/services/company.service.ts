import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Company } from './contact.service';

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly http = inject(HttpClient);

  getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>('/api/companies');
  }
}
