import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleProposalDetails } from './sample-proposal-details';

describe('SampleProposalDetails', () => {
  let component: SampleProposalDetails;
  let fixture: ComponentFixture<SampleProposalDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SampleProposalDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SampleProposalDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
