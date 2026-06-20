import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  let component: SkeletonComponent;
  let fixture: ComponentFixture<SkeletonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SkeletonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render with default dimensions', () => {
    const el = fixture.nativeElement.querySelector('.skeleton');
    expect(el).toBeTruthy();
    expect(el.style.width).toBe('100%');
    expect(el.style.height).toBe('16px');
  });

  it('should accept custom width input', () => {
    component.width = '200px';
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('.skeleton');
    expect(el.style.width).toBe('200px');
  });

  it('should accept custom height input', () => {
    component.height = '40px';
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('.skeleton');
    expect(el.style.height).toBe('40px');
  });

  it('should have role="status" for accessibility', () => {
    const el = fixture.nativeElement.querySelector('.skeleton');
    expect(el.getAttribute('role')).toBe('status');
  });

  it('should have aria-label for screen readers', () => {
    const el = fixture.nativeElement.querySelector('.skeleton');
    expect(el.getAttribute('aria-label')).toBe('Loading...');
  });
});
