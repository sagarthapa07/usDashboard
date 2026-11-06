import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrantsForBUSI } from './grants-for-busi';

describe('GrantsForBUSI', () => {
  let component: GrantsForBUSI;
  let fixture: ComponentFixture<GrantsForBUSI>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrantsForBUSI]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrantsForBUSI);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
