import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyInvoices } from './my-invoices';

describe('MyInvoices', () => {
  let component: MyInvoices;
  let fixture: ComponentFixture<MyInvoices>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyInvoices]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyInvoices);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
