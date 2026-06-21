import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { map } from 'rxjs/operators';
import { TaskService, Task, CreateTaskRequest } from '../../../core/services/task.service';
import { ToastService } from '../../../core/services/toast.service';
import { TaskDrawerComponent } from '../task-drawer/task-drawer.component';

@Component({
  selector: 'app-tasks-list',
  standalone: true,
  imports: [CommonModule, DatePipe, TaskDrawerComponent],
  template: `
    <div class="tasks-list">
      <div class="tasks-list__header">
        <h3 class="tasks-list__title">Tasks</h3>
        <button type="button" class="btn btn--primary btn--sm" (click)="openDrawer()">New Task</button>
      </div>

      @if (loading) {
        <p class="tasks-list__loading">Loading tasks…</p>
      } @else if (tasks.length === 0) {
        <p class="tasks-list__empty">No tasks yet.</p>
      } @else {
        <ul class="tasks-list__items">
          @for (task of tasks; track task.id) {
            <li class="task-item" [class.task-item--done]="task.completed">
              <input
                type="checkbox"
                [checked]="task.completed"
                (change)="toggleComplete(task)"
                [attr.aria-label]="'Mark ' + task.title + ' complete'"
              />
              <div class="task-item__info">
                <span class="task-item__title">{{ task.title }}</span>
                @if (task.dueDate) {
                  <span class="task-item__due" [class.task-item__due--overdue]="isOverdue(task.dueDate)">
                    {{ task.dueDate | date:'mediumDate' }}
                  </span>
                }
                @if (task.assigneeName) {
                  <span class="task-item__assignee">{{ task.assigneeName }}</span>
                }
              </div>
              <button
                type="button"
                class="btn btn--ghost btn--sm"
                (click)="requestDelete(task)"
              >Delete</button>
            </li>
          }
        </ul>
      }

      @if (showDrawer) {
        <app-task-drawer
          [task]="editingTask"
          [contactId]="contactId"
          [dealId]="dealId"
          (taskSaved)="onTaskSaved($event)"
          (closed)="closeDrawer()"
        />
      }
    </div>
  `,
  styles: [`
    .tasks-list__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); }
    .tasks-list__title { font-size: var(--font-size-base); font-weight: var(--font-weight-medium); margin: 0; }
    .tasks-list__loading, .tasks-list__empty { color: var(--color-text-secondary); font-size: var(--font-size-sm); }
    .tasks-list__items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-2); }
    .task-item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
    .task-item--done .task-item__title { text-decoration: line-through; color: var(--color-text-secondary); }
    .task-item__info { flex: 1; display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; }
    .task-item__title { font-size: var(--font-size-sm); }
    .task-item__due { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
    .task-item__due--overdue { color: var(--color-error); }
    .task-item__assignee { font-size: var(--font-size-xs); color: var(--color-text-secondary); }
    .btn--sm { padding: var(--space-1) var(--space-3); font-size: var(--font-size-sm); }
    .btn--ghost { background: none; border: 1px solid var(--color-border); color: var(--color-text-secondary); cursor: pointer; border-radius: var(--radius-sm); }
  `],
})
export class TasksListComponent implements OnInit {
  @Input() contactId?: number;
  @Input() dealId?: number;

  private readonly taskService = inject(TaskService);
  private readonly toastService = inject(ToastService);

  tasks: Task[] = [];
  loading = false;
  showDrawer = false;
  editingTask: Task | null = null;

  ngOnInit(): void {
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading = true;
    const obs = this.contactId !== undefined
      ? this.taskService.getByContact(this.contactId)
      : this.dealId !== undefined
        ? this.taskService.getByDeal(this.dealId)
        : this.taskService.getTasks().pipe(
            map(page => page.content)
          );

    obs.subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.loading = false;
      },
      error: () => {
        this.toastService.add('Failed to load tasks', 'error');
        this.loading = false;
      },
    });
  }

  openDrawer(task: Task | null = null): void {
    this.editingTask = task;
    this.showDrawer = true;
  }

  closeDrawer(): void {
    this.showDrawer = false;
    this.editingTask = null;
  }

  onTaskSaved(task: Task): void {
    const idx = this.tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      this.tasks = [...this.tasks.slice(0, idx), task, ...this.tasks.slice(idx + 1)];
    } else {
      this.tasks = [...this.tasks, task];
    }
    this.closeDrawer();
  }

  toggleComplete(task: Task): void {
    const prevCompleted = task.completed;
    task.completed = !task.completed;
    this.taskService.completeTask(task.id, task.completed).subscribe({
      error: () => {
        task.completed = prevCompleted;
        this.toastService.add('Failed to update task', 'error');
      },
    });
  }

  requestDelete(task: Task): void {
    this.taskService.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter((t) => t.id !== task.id);
        this.toastService.add('Task deleted', 'success');
      },
      error: () => this.toastService.add('Failed to delete task', 'error'),
    });
  }

  isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date() && dueDate !== '';
  }
}
