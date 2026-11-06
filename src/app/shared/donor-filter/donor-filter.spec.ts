import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorFilter } from './donor-filter';

describe('DonorFilter', () => {
  let component: DonorFilter;
  let fixture: ComponentFixture<DonorFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorFilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DonorFilter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
