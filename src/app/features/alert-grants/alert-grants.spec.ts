import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertGrants } from './alert-grants';

describe('AlertGrants', () => {
  let component: AlertGrants;
  let fixture: ComponentFixture<AlertGrants>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertGrants]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertGrants);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
