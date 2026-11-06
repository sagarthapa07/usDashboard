import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FundingAlert } from './funding-alert';

describe('FundingAlert', () => {
  let component: FundingAlert;
  let fixture: ComponentFixture<FundingAlert>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundingAlert]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FundingAlert);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
