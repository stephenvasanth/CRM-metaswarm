import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TagChipComponent } from './tag-chip.component';
import { Tag } from '../../../core/services/contact.service';

describe('TagChipComponent', () => {
  let component: TagChipComponent;
  let fixture: ComponentFixture<TagChipComponent>;

  const darkTag: Tag = { id: '1', name: 'VIP', colour: '#4F46E5' };
  const lightTag: Tag = { id: '2', name: 'Note', colour: '#FFFFFF' };
  const yellowTag: Tag = { id: '3', name: 'Warm', colour: '#FFFF00' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagChipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TagChipComponent);
    component = fixture.componentInstance;
    component.tag = darkTag;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the tag name', () => {
    const span = fixture.nativeElement.querySelector('.tag-chip');
    expect(span.textContent.trim()).toBe('VIP');
  });

  it('should apply tag colour as background', () => {
    const span = fixture.nativeElement.querySelector('.tag-chip') as HTMLElement;
    expect(span.style.backgroundColor).toBeTruthy();
  });

  it('should return white text for dark backgrounds (luminance <= 0.5)', () => {
    component.tag = darkTag; // #4F46E5 is dark
    expect(component.textColor).toBe('#FFFFFF');
  });

  it('should return dark text for light backgrounds (luminance > 0.5)', () => {
    component.tag = lightTag; // #FFFFFF is light
    expect(component.textColor).toBe('#1E293B');
  });

  it('should return dark text for yellow (luminance > 0.5)', () => {
    component.tag = yellowTag; // #FFFF00 is bright
    expect(component.textColor).toBe('#1E293B');
  });

  it('should update when tag input changes', () => {
    component.tag = { id: '2', name: 'Lead', colour: '#10B981' };
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('.tag-chip');
    expect(span.textContent.trim()).toBe('Lead');
  });
});
