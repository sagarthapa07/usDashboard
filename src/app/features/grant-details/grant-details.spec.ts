import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrantDetails } from './grant-details';

describe('GrantDetails', () => {
  let component: GrantDetails;
  let fixture: ComponentFixture<GrantDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrantDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrantDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
