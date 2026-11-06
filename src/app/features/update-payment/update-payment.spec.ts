import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdatePayment } from './update-payment';

describe('UpdatePayment', () => {
  let component: UpdatePayment;
  let fixture: ComponentFixture<UpdatePayment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatePayment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdatePayment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
