import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleProposal } from './sample-proposal';

describe('SampleProposal', () => {
  let component: SampleProposal;
  let fixture: ComponentFixture<SampleProposal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SampleProposal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SampleProposal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
