import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrantSearchFilter } from './grant-search-filter';

describe('GrantSearchFilter', () => {
  let component: GrantSearchFilter;
  let fixture: ComponentFixture<GrantSearchFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrantSearchFilter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrantSearchFilter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
