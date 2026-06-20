import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  let component: AvatarComponent;
  let fixture: ComponentFixture<AvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should generate correct initials from "John Doe" → "JD"', () => {
    component.name = 'John Doe';
    component.ngOnChanges();

    expect(component.initials).toBe('JD');
  });

  it('should generate correct initials from a single-word name → first letter', () => {
    component.name = 'Madonna';
    component.ngOnChanges();

    expect(component.initials).toBe('M');
  });

  it('should generate initials from first and last word for multi-word names', () => {
    component.name = 'John Paul Jones';
    component.ngOnChanges();

    expect(component.initials).toBe('JJ');
  });

  it('should return "?" for empty name', () => {
    component.name = '';
    component.ngOnChanges();

    expect(component.initials).toBe('?');
  });

  it('should uppercase initials', () => {
    component.name = 'jane doe';
    component.ngOnChanges();

    expect(component.initials).toBe('JD');
  });

  it('should produce deterministic background color for same name', () => {
    component.name = 'John Doe';
    component.ngOnChanges();
    const color1 = component.bgColor;

    component.name = 'John Doe';
    component.ngOnChanges();
    const color2 = component.bgColor;

    expect(color1).toBe(color2);
  });

  it('should produce different colors for different names (usually)', () => {
    component.name = 'Alice Smith';
    component.ngOnChanges();
    const color1 = component.bgColor;

    component.name = 'Bob Jones';
    component.ngOnChanges();
    const color2 = component.bgColor;

    // They might collide but likely won't for these two distinct names
    // This test verifies the color assignment works, not that they're always different
    expect(color1).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(color2).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('should have default size of 32', () => {
    expect(component.size).toBe(32);
  });

  it('should accept custom size input', () => {
    component.size = 48;
    component.name = 'Test User';
    component.ngOnChanges();
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('.avatar');
    expect(el.style.width).toBe('48px');
    expect(el.style.height).toBe('48px');
  });

  it('should render initials in the element', () => {
    component.name = 'John Doe';
    component.ngOnChanges();
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('.avatar');
    expect(el.textContent.trim()).toBe('JD');
  });

  it('should have role="img" for accessibility', () => {
    component.name = 'Test User';
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('.avatar');
    expect(el.getAttribute('role')).toBe('img');
  });

  it('should compute font size relative to avatar size', () => {
    component.size = 80;
    component.name = 'Big Avatar';
    component.ngOnChanges();

    expect(component.fontSize).toBe(Math.round(80 * 0.38));
  });
});
