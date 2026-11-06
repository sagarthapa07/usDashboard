import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Loaders } from './loaders';

describe('Loaders', () => {
  let component: Loaders;
  let fixture: ComponentFixture<Loaders>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Loaders]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Loaders);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
