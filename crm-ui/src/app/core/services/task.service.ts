import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Task {
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

export interface CreateTaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  assigneeId?: number;
  contactId?: number;
  dealId?: number;
}

export interface TaskPage {
  content: Task[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);

  getTasks(page = 0, size = 20, completed?: boolean): Observable<TaskPage> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    if (completed !== undefined) {
      params = params.set('completed', String(completed));
    }
    return this.http.get<TaskPage>('/api/tasks', { params });
  }

  getByContact(contactId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`/api/contacts/${contactId}/tasks`);
  }

  getByDeal(dealId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`/api/deals/${dealId}/tasks`);
  }

  createTask(req: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>('/api/tasks', req);
  }

  updateTask(id: number, req: CreateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`/api/tasks/${id}`, req);
  }

  completeTask(id: number, completed: boolean): Observable<Task> {
    return this.http.patch<Task>(`/api/tasks/${id}/complete`, { completed });
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`/api/tasks/${id}`);
  }
}
