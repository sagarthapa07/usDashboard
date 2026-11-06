import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpcomingDeadlines } from './upcoming-deadlines';

describe('UpcomingDeadlines', () => {
  let component: UpcomingDeadlines;
  let fixture: ComponentFixture<UpcomingDeadlines>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpcomingDeadlines]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpcomingDeadlines);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
