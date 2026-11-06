import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeadlineFreeGrants } from './deadline-free-grants';

describe('DeadlineFreeGrants', () => {
  let component: DeadlineFreeGrants;
  let fixture: ComponentFixture<DeadlineFreeGrants>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeadlineFreeGrants]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeadlineFreeGrants);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
