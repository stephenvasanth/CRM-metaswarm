import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TaskDrawerComponent } from './task-drawer.component';
import { TaskService, Task } from '../../../core/services/task.service';
import { ToastService } from '../../../core/services/toast.service';

describe('TaskDrawerComponent', () => {
  let component: TaskDrawerComponent;
  let fixture: ComponentFixture<TaskDrawerComponent>;
  let taskServiceSpy: jasmine.SpyObj<TaskService>;
  let toastServiceSpy: jasmine.SpyObj<ToastService>;

  const mockTask: Task = {
    id: 1,
    title: 'Call Alice',
    description: 'Discuss Q3 deal',
    dueDate: '2026-12-31',
    completed: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  function setup(task: Task | null = null): void {
    taskServiceSpy = jasmine.createSpyObj('TaskService', ['createTask', 'updateTask']);
    toastServiceSpy = jasmine.createSpyObj('ToastService', ['add']);
    taskServiceSpy.createTask.and.returnValue(of(mockTask));
    taskServiceSpy.updateTask.and.returnValue(of(mockTask));

    TestBed.configureTestingModule({
      imports: [TaskDrawerComponent],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: ToastService, useValue: toastServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskDrawerComponent);
    component = fixture.componentInstance;
    if (task) component.task = task;
    fixture.detectChanges();
  }

  describe('create mode', () => {
    beforeEach(() => setup());

    it('should create', () => expect(component).toBeTruthy());

    it('should show "New Task" title', () => {
      const title = fixture.nativeElement.querySelector('.drawer__title');
      expect(title.textContent.trim()).toBe('New Task');
    });

    it('should start with empty form', () => {
      expect(component.form.value.title).toBe('');
      expect(component.form.value.description).toBe('');
      expect(component.form.value.dueDate).toBe('');
    });

    it('should mark all touched and not call API when form is invalid', () => {
      component.submit();
      expect(taskServiceSpy.createTask).not.toHaveBeenCalled();
      expect(component.form.controls.title.touched).toBeTrue();
    });

    it('should call createTask and emit taskSaved on success', () => {
      const savedSpy = jasmine.createSpy('taskSaved');
      component.taskSaved.subscribe(savedSpy);
      component.form.setValue({ title: 'Buy milk', description: '', dueDate: '' });
      component.submit();
      expect(taskServiceSpy.createTask).toHaveBeenCalledWith(
        jasmine.objectContaining({ title: 'Buy milk' })
      );
      expect(savedSpy).toHaveBeenCalledWith(mockTask);
      expect(component.submitting).toBeFalse();
    });

    it('should pass contactId and dealId in request', () => {
      component.contactId = 3;
      component.dealId = 7;
      component.form.setValue({ title: 'Follow up', description: '', dueDate: '' });
      component.submit();
      const req = taskServiceSpy.createTask.calls.mostRecent().args[0];
      expect(req.contactId).toBe(3);
      expect(req.dealId).toBe(7);
    });

    it('should omit empty optional fields from request', () => {
      component.form.setValue({ title: 'Task', description: '', dueDate: '' });
      component.submit();
      const req = taskServiceSpy.createTask.calls.mostRecent().args[0];
      expect(req.description).toBeUndefined();
      expect(req.dueDate).toBeUndefined();
    });

    it('should show error toast and reset submitting on failure', () => {
      taskServiceSpy.createTask.and.returnValue(throwError(() => new Error('500')));
      component.form.setValue({ title: 'Fail', description: '', dueDate: '' });
      component.submit();
      expect(toastServiceSpy.add).toHaveBeenCalledWith('Failed to save task', 'error');
      expect(component.submitting).toBeFalse();
    });
  });

  describe('edit mode', () => {
    beforeEach(() => setup(mockTask));

    it('should show "Edit Task" title', () => {
      const title = fixture.nativeElement.querySelector('.drawer__title');
      expect(title.textContent.trim()).toBe('Edit Task');
    });

    it('should pre-populate form with task data', () => {
      expect(component.form.value.title).toBe('Call Alice');
      expect(component.form.value.description).toBe('Discuss Q3 deal');
      expect(component.form.value.dueDate).toBe('2026-12-31');
    });

    it('should call updateTask and emit taskSaved on success', () => {
      const savedSpy = jasmine.createSpy('taskSaved');
      component.taskSaved.subscribe(savedSpy);
      component.form.setValue({ title: 'Updated', description: '', dueDate: '' });
      component.submit();
      expect(taskServiceSpy.updateTask).toHaveBeenCalledWith(1, jasmine.objectContaining({ title: 'Updated' }));
      expect(savedSpy).toHaveBeenCalledWith(mockTask);
    });

    it('should use task contactId and dealId when editing', () => {
      const taskWithLinks: Task = { ...mockTask, contactId: 5, dealId: 9 };
      component.task = taskWithLinks;
      component.form.setValue({ title: 'Updated', description: '', dueDate: '' });
      component.submit();
      const req = taskServiceSpy.updateTask.calls.mostRecent().args[1];
      expect(req.contactId).toBe(5);
      expect(req.dealId).toBe(9);
    });
  });

  describe('closed event', () => {
    beforeEach(() => setup());

    it('should emit closed when overlay is clicked', () => {
      const closedSpy = jasmine.createSpy('closed');
      component.closed.subscribe(closedSpy);
      const overlay = fixture.nativeElement.querySelector('.drawer-overlay');
      overlay.click();
      expect(closedSpy).toHaveBeenCalled();
    });
  });

  describe('template', () => {
    beforeEach(() => setup());

    it('should show Saving… while submitting', () => {
      component.submitting = true;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(btn.textContent.trim()).toBe('Saving…');
    });

    it('should disable submit button while submitting', () => {
      component.submitting = true;
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(btn.disabled).toBeTrue();
    });
  });
});
