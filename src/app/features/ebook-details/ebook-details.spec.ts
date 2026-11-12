import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EbookDetails } from './ebook-details';

describe('EbookDetails', () => {
  let component: EbookDetails;
  let fixture: ComponentFixture<EbookDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EbookDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EbookDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
