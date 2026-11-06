import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeatestGrant } from './leatest-grant';

describe('LeatestGrant', () => {
  let component: LeatestGrant;
  let fixture: ComponentFixture<LeatestGrant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeatestGrant]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeatestGrant);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
