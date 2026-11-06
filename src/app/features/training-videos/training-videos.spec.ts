import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrainingVideos } from './training-videos';

describe('TrainingVideos', () => {
  let component: TrainingVideos;
  let fixture: ComponentFixture<TrainingVideos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrainingVideos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrainingVideos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
