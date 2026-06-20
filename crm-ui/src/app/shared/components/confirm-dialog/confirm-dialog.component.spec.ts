import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { By } from '@angular/platform-browser';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title', () => {
    component.title = 'Delete Contact?';
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector('.dialog__title');
    expect(titleEl.textContent.trim()).toBe('Delete Contact?');
  });

  it('should render message', () => {
    component.message = 'This action cannot be undone.';
    fixture.detectChanges();

    const msgEl = fixture.nativeElement.querySelector('.dialog__message');
    expect(msgEl.textContent.trim()).toBe('This action cannot be undone.');
  });

  it('should use default confirmLabel "Delete"', () => {
    fixture.detectChanges();
    const confirmBtn = fixture.nativeElement.querySelector('.dialog__btn--confirm');
    expect(confirmBtn.textContent.trim()).toBe('Delete');
  });

  it('should use default cancelLabel "Cancel"', () => {
    fixture.detectChanges();
    const cancelBtn = fixture.nativeElement.querySelector('.dialog__btn--cancel');
    expect(cancelBtn.textContent.trim()).toBe('Cancel');
  });

  it('should use custom confirmLabel', () => {
    component.confirmLabel = 'Remove';
    fixture.detectChanges();

    const confirmBtn = fixture.nativeElement.querySelector('.dialog__btn--confirm');
    expect(confirmBtn.textContent.trim()).toBe('Remove');
  });

  it('should emit true when confirm button clicked', () => {
    const emitted: boolean[] = [];
    component.confirmed.subscribe((v) => emitted.push(v));

    const confirmBtn = fixture.nativeElement.querySelector('.dialog__btn--confirm');
    confirmBtn.click();

    expect(emitted).toEqual([true]);
  });

  it('should emit false when cancel button clicked', () => {
    const emitted: boolean[] = [];
    component.confirmed.subscribe((v) => emitted.push(v));

    const cancelBtn = fixture.nativeElement.querySelector('.dialog__btn--cancel');
    cancelBtn.click();

    expect(emitted).toEqual([false]);
  });

  it('should emit false when overlay (backdrop) is clicked', () => {
    const emitted: boolean[] = [];
    component.confirmed.subscribe((v) => emitted.push(v));

    const overlay = fixture.nativeElement.querySelector('.overlay');
    // Simulate click directly on the overlay element
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: overlay });
    component.onOverlayClick(event);

    expect(emitted).toEqual([false]);
  });

  it('should not emit when clicking inside dialog (not overlay)', () => {
    const emitted: boolean[] = [];
    component.confirmed.subscribe((v) => emitted.push(v));

    const dialog = fixture.nativeElement.querySelector('.dialog');
    const event = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(event, 'target', { value: dialog });
    component.onOverlayClick(event);

    expect(emitted).toEqual([]);
  });

  it('should have a unique instanceId', () => {
    expect(component.instanceId).toBeTruthy();
    expect(typeof component.instanceId).toBe('string');
  });
});
