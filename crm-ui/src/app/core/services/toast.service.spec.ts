import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService, Toast } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('add()', () => {
    it('should push a toast to toasts$', (done) => {
      service.add('Hello', 'success');
      service.toasts$.subscribe((toasts) => {
        expect(toasts.length).toBe(1);
        expect(toasts[0].message).toBe('Hello');
        expect(toasts[0].type).toBe('success');
        expect(toasts[0].id).toMatch(/^toast-/);
        done();
      });
    });

    it('should default type to info when not specified', (done) => {
      service.add('Info message');
      service.toasts$.subscribe((toasts) => {
        expect(toasts[0].type).toBe('info');
        done();
      });
    });

    it('should add multiple toasts', (done) => {
      service.add('First', 'success');
      service.add('Second', 'error');
      service.add('Third', 'info');
      service.toasts$.subscribe((toasts) => {
        expect(toasts.length).toBe(3);
        done();
      });
    });

    it('should limit to 3 toasts max and remove oldest on overflow', (done) => {
      service.add('First', 'info');
      service.add('Second', 'info');
      service.add('Third', 'info');
      service.add('Fourth', 'success');

      service.toasts$.subscribe((toasts) => {
        expect(toasts.length).toBe(3);
        expect(toasts[0].message).toBe('Second');
        expect(toasts[2].message).toBe('Fourth');
        done();
      });
    });

    it('should auto-remove toast after 4000ms', fakeAsync(() => {
      service.add('Auto remove', 'info');

      let toasts: Toast[] = [];
      service.toasts$.subscribe((t) => (toasts = t));

      expect(toasts.length).toBe(1);
      tick(4000);
      expect(toasts.length).toBe(0);
    }));
  });

  describe('remove()', () => {
    it('should remove toast by id', (done) => {
      service.add('First', 'info');
      service.add('Second', 'success');

      let toasts: Toast[] = [];
      service.toasts$.subscribe((t) => (toasts = t));

      const idToRemove = toasts[0].id;
      service.remove(idToRemove);

      service.toasts$.subscribe((t) => {
        expect(t.length).toBe(1);
        expect(t[0].message).toBe('Second');
        done();
      });
    });

    it('should not fail when removing non-existent id', (done) => {
      service.add('Test', 'info');
      service.remove('non-existent-id');

      service.toasts$.subscribe((toasts) => {
        expect(toasts.length).toBe(1);
        done();
      });
    });

    it('should remove correct toast when multiple exist', () => {
      service.add('First', 'info');
      service.add('Second', 'success');
      service.add('Third', 'error');

      let toasts: Toast[] = [];
      service.toasts$.subscribe((t) => (toasts = t));

      const middleId = toasts[1].id;
      service.remove(middleId);

      expect(toasts.length).toBe(2);
      expect(toasts.find((t) => t.id === middleId)).toBeUndefined();
    });
  });
});
