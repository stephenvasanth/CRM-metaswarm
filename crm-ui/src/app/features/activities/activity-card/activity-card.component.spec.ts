import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityCardComponent } from './activity-card.component';
import { Activity } from '../../../core/services/activity.service';

describe('ActivityCardComponent', () => {
  let component: ActivityCardComponent;
  let fixture: ComponentFixture<ActivityCardComponent>;

  const mockActivity: Activity = {
    id: 1,
    type: 'CALL',
    subject: 'Follow-up call',
    notes: 'Discussed pricing',
    occurredAt: '2024-06-01T10:00:00Z',
    authorName: 'Alice Smith',
    createdAt: '2024-06-01T10:00:00Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityCardComponent);
    component = fixture.componentInstance;
    component.activity = mockActivity;
    fixture.detectChanges();
  });

  it('should create', () => expect(component).toBeTruthy());

  describe('typeColour getter', () => {
    it('should return blue for CALL', () => {
      component.activity = { ...mockActivity, type: 'CALL' };
      expect(component.typeColour).toBe('#3B82F6');
    });

    it('should return purple for EMAIL', () => {
      component.activity = { ...mockActivity, type: 'EMAIL' };
      expect(component.typeColour).toBe('#8B5CF6');
    });

    it('should return green for MEETING', () => {
      component.activity = { ...mockActivity, type: 'MEETING' };
      expect(component.typeColour).toBe('#10B981');
    });

    it('should return grey for NOTE', () => {
      component.activity = { ...mockActivity, type: 'NOTE' };
      expect(component.typeColour).toBe('#94A3B8');
    });

    it('should return default grey for unknown type', () => {
      component.activity = { ...mockActivity, type: 'UNKNOWN' as any };
      expect(component.typeColour).toBe('#94A3B8');
    });
  });

  describe('template', () => {
    it('should render subject', () => {
      const subject = fixture.nativeElement.querySelector('.activity-card__subject');
      expect(subject.textContent.trim()).toBe('Follow-up call');
    });

    it('should render notes when present', () => {
      const notes = fixture.nativeElement.querySelector('.activity-card__notes');
      expect(notes.textContent.trim()).toBe('Discussed pricing');
    });

    it('should render author name when present', () => {
      const meta = fixture.nativeElement.querySelector('.activity-card__meta');
      expect(meta.textContent).toContain('Alice Smith');
    });

    it('should not render notes when absent', () => {
      component.activity = { ...mockActivity, notes: undefined };
      fixture.detectChanges();
      const notes = fixture.nativeElement.querySelector('.activity-card__notes');
      expect(notes).toBeNull();
    });

    it('should not render author when absent', () => {
      component.activity = { ...mockActivity, authorName: undefined };
      fixture.detectChanges();
      const spans = fixture.nativeElement.querySelectorAll('.activity-card__meta span');
      expect(spans.length).toBe(1); // only the date
    });
  });
});
