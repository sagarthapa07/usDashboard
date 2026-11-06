import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonorSearch } from './donor-search';

describe('DonorSearch', () => {
  let component: DonorSearch;
  let fixture: ComponentFixture<DonorSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonorSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DonorSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
