import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeadlineCalendar } from './deadline-calendar';

describe('DeadlineCalendar', () => {
  let component: DeadlineCalendar;
  let fixture: ComponentFixture<DeadlineCalendar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeadlineCalendar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeadlineCalendar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
