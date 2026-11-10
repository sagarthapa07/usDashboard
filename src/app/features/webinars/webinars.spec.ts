import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Webinars } from './webinars';

describe('Webinars', () => {
  let component: Webinars;
  let fixture: ComponentFixture<Webinars>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Webinars]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Webinars);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
