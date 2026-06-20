import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';
import { By } from '@angular/platform-browser';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render with primary variant by default', () => {
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList).toContain('btn--primary');
  });

  it('should render with md size by default', () => {
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList).toContain('btn--md');
  });

  it('should apply secondary variant class', () => {
    component.variant = 'secondary';
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList).toContain('btn--secondary');
  });

  it('should apply danger variant class', () => {
    component.variant = 'danger';
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList).toContain('btn--danger');
  });

  it('should apply ghost variant class', () => {
    component.variant = 'ghost';
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList).toContain('btn--ghost');
  });

  it('should apply sm size class', () => {
    component.size = 'sm';
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList).toContain('btn--sm');
  });

  it('should apply lg size class', () => {
    component.size = 'lg';
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.classList).toContain('btn--lg');
  });

  it('should show spinner when loading=true', () => {
    component.loading = true;
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('.btn__spinner');
    expect(spinner).toBeTruthy();
  });

  it('should not show spinner when loading=false', () => {
    component.loading = false;
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('.btn__spinner');
    expect(spinner).toBeNull();
  });

  it('should be disabled when loading=true', () => {
    component.loading = true;
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBeTrue();
  });

  it('should be disabled when disabled=true', () => {
    component.disabled = true;
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBeTrue();
  });

  it('should not be disabled by default', () => {
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBeFalse();
  });

  it('should have aria-busy=true when loading', () => {
    component.loading = true;
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button');
    expect(btn.getAttribute('aria-busy')).toBe('true');
  });
});
