import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrantsForORG } from './grants-for-org';

describe('GrantsForORG', () => {
  let component: GrantsForORG;
  let fixture: ComponentFixture<GrantsForORG>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrantsForORG]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrantsForORG);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
