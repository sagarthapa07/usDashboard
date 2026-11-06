import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchHero } from './search-hero';

describe('SearchHero', () => {
  let component: SearchHero;
  let fixture: ComponentFixture<SearchHero>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchHero]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchHero);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
