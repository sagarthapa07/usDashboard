import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrantsForINDI } from './grants-for-indi';

describe('GrantsForINDI', () => {
  let component: GrantsForINDI;
  let fixture: ComponentFixture<GrantsForINDI>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrantsForINDI]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrantsForINDI);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
