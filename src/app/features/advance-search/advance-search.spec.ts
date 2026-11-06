import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvanceSearch } from './advance-search';

describe('AdvanceSearch', () => {
  let component: AdvanceSearch;
  let fixture: ComponentFixture<AdvanceSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdvanceSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdvanceSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
