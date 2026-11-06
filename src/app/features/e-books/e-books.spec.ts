import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EBooks } from './e-books';

describe('EBooks', () => {
  let component: EBooks;
  let fixture: ComponentFixture<EBooks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EBooks]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EBooks);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
