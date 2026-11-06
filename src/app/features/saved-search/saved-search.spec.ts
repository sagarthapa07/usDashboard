import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SavedSearch } from './saved-search';

describe('SavedSearch', () => {
  let component: SavedSearch;
  let fixture: ComponentFixture<SavedSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SavedSearch]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SavedSearch);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
