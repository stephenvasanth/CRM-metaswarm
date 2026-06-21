import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TasksListComponent } from './tasks-list.component';
import { TaskService, Task, TaskPage } from '../../../core/services/task.service';
import { ToastService } from '../../../core/services/toast.service';

describe('TasksListComponent', () => {
  let component: TasksListComponent;
  let fixture: ComponentFixture<TasksListComponent>;
  let taskServiceSpy: jasmine.SpyObj<TaskService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockTask: Task = {
    id: 1,
    title: 'Call Alice',
    completed: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const overdueTask: Task = {
    id: 2,
    title: 'Old task',
    completed: false,
    dueDate: '2020-01-01',
    createdAt: '2020-01-01T00:00:00Z',
    updatedAt: '2020-01-01T00:00:00Z',
  };

  const completedTask: Task = {
    id: 3,
    title: 'Done task',
    completed: true,
    assigneeName: 'Bob',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockPage: TaskPage = {
    content: [mockTask],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 20,
  };

  function setup(inputs: { contactId?: number; dealId?: number } = {}): void {
    taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'getTasks',
      'getByContact',
      'getByDeal',
      'completeTask',
      'deleteTask',
    ]);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['add']);

    taskServiceSpy.getTasks.and.returnValue(of(mockPage));
    taskServiceSpy.getByContact.and.returnValue(of([mockTask]));
    taskServiceSpy.getByDeal.and.returnValue(of([mockTask]));
    taskServiceSpy.completeTask.and.returnValue(of({ ...mockTask, completed: true }));
    taskServiceSpy.deleteTask.and.returnValue(of(void 0));

    TestBed.configureTestingModule({
      imports: [TasksListComponent],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TasksListComponent);
    component = fixture.componentInstance;
    if (inputs.contactId !== undefined) component.contactId = inputs.contactId;
    if (inputs.dealId !== undefined) component.dealId = inputs.dealId;
    fixture.detectChanges();
  }

  describe('standalone route (no contactId/dealId)', () => {
    beforeEach(() => setup());

    it('should create', () => expect(component).toBeTruthy());

    it('should call getTasks() when no contactId or dealId', () => {
      expect(taskServiceSpy.getTasks).toHaveBeenCalled();
      expect(taskServiceSpy.getByContact).not.toHaveBeenCalled();
      expect(component.tasks).toEqual([mockTask]);
      expect(component.loading).toBeFalse();
    });

    it('should show error toast and clear loading on getTasks error', () => {
      taskServiceSpy.getTasks.and.returnValue(throwError(() => new Error('500')));
      component.loadTasks();
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to load tasks', 'error');
      expect(component.loading).toBeFalse();
    });

    it('should render task rows', () => {
      fixture.detectChanges();
      const items = fixture.nativeElement.querySelectorAll('.task-item');
      expect(items.length).toBe(1);
    });

    it('should show empty state when no tasks', () => {
      taskServiceSpy.getTasks.and.returnValue(of({ ...mockPage, content: [] }));
      component.loadTasks();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.tasks-list__empty')).toBeTruthy();
    });
  });

  describe('with contactId', () => {
    beforeEach(() => setup({ contactId: 42 }));

    it('should call getByContact() when contactId is set', () => {
      expect(taskServiceSpy.getByContact).toHaveBeenCalledWith(42);
      expect(taskServiceSpy.getTasks).not.toHaveBeenCalled();
    });
  });

  describe('with dealId', () => {
    beforeEach(() => setup({ dealId: 7 }));

    it('should call getByDeal() when dealId is set', () => {
      expect(taskServiceSpy.getByDeal).toHaveBeenCalledWith(7);
      expect(taskServiceSpy.getTasks).not.toHaveBeenCalled();
    });
  });

  describe('openDrawer / closeDrawer', () => {
    beforeEach(() => setup());

    it('should show drawer on openDrawer()', () => {
      expect(component.showDrawer).toBeFalse();
      component.openDrawer();
      expect(component.showDrawer).toBeTrue();
      expect(component.editingTask).toBeNull();
    });

    it('should set editingTask on openDrawer(task)', () => {
      component.openDrawer(mockTask);
      expect(component.editingTask).toBe(mockTask);
    });

    it('should hide drawer and clear editingTask on closeDrawer()', () => {
      component.openDrawer(mockTask);
      component.closeDrawer();
      expect(component.showDrawer).toBeFalse();
      expect(component.editingTask).toBeNull();
    });
  });

  describe('onTaskSaved()', () => {
    beforeEach(() => setup());

    it('should add new task to list when id not already in list', () => {
      const newTask: Task = { ...mockTask, id: 99, title: 'New' };
      component.onTaskSaved(newTask);
      expect(component.tasks).toContain(newTask);
    });

    it('should replace existing task in list when id matches', () => {
      const updated: Task = { ...mockTask, title: 'Updated' };
      component.tasks = [mockTask];
      component.onTaskSaved(updated);
      expect(component.tasks[0].title).toBe('Updated');
    });

    it('should close drawer after saving', () => {
      component.showDrawer = true;
      component.onTaskSaved(mockTask);
      expect(component.showDrawer).toBeFalse();
    });
  });

  describe('toggleComplete()', () => {
    beforeEach(() => setup());

    it('should optimistically flip completed and call completeTask', () => {
      component.tasks = [{ ...mockTask, completed: false }];
      component.toggleComplete(component.tasks[0]);
      expect(taskServiceSpy.completeTask).toHaveBeenCalledWith(1, true);
    });

    it('should revert completed and show error toast on failure', () => {
      taskServiceSpy.completeTask.and.returnValue(throwError(() => new Error('500')));
      component.tasks = [{ ...mockTask, completed: false }];
      const task = component.tasks[0];
      component.toggleComplete(task);
      expect(task.completed).toBeFalse();
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to update task', 'error');
    });
  });

  describe('requestDelete()', () => {
    beforeEach(() => setup());

    it('should remove task from list and show success toast', () => {
      component.tasks = [mockTask];
      component.requestDelete(mockTask);
      expect(component.tasks.length).toBe(0);
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Task deleted', 'success');
    });

    it('should show error toast on delete failure', () => {
      taskServiceSpy.deleteTask.and.returnValue(throwError(() => new Error('500')));
      component.tasks = [mockTask];
      component.requestDelete(mockTask);
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to delete task', 'error');
    });
  });

  describe('isOverdue()', () => {
    beforeEach(() => setup());

    it('should return true for a past date', () => {
      expect(component.isOverdue('2020-01-01')).toBeTrue();
    });

    it('should return false for a future date', () => {
      expect(component.isOverdue('2099-12-31')).toBeFalse();
    });

    it('should return false for empty string', () => {
      expect(component.isOverdue('')).toBeFalse();
    });
  });

  describe('template', () => {
    beforeEach(() => setup());

    it('should render overdue class for overdue tasks', () => {
      taskServiceSpy.getTasks.and.returnValue(of({ ...mockPage, content: [overdueTask] }));
      component.loadTasks();
      fixture.detectChanges();
      const due = fixture.nativeElement.querySelector('.task-item__due--overdue');
      expect(due).toBeTruthy();
    });

    it('should apply done class to completed tasks', () => {
      taskServiceSpy.getTasks.and.returnValue(of({ ...mockPage, content: [completedTask] }));
      component.loadTasks();
      fixture.detectChanges();
      const item = fixture.nativeElement.querySelector('.task-item--done');
      expect(item).toBeTruthy();
    });

    it('should render assignee name when present', () => {
      taskServiceSpy.getTasks.and.returnValue(of({ ...mockPage, content: [completedTask] }));
      component.loadTasks();
      fixture.detectChanges();
      const assignee = fixture.nativeElement.querySelector('.task-item__assignee');
      expect(assignee?.textContent?.trim()).toBe('Bob');
    });

    it('should show loading indicator', () => {
      component.loading = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.tasks-list__loading')).toBeTruthy();
    });
  });
});
