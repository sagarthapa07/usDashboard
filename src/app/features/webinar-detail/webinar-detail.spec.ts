import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WebinarDetail } from './webinar-detail';

describe('WebinarDetail', () => {
  let component: WebinarDetail;
  let fixture: ComponentFixture<WebinarDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WebinarDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WebinarDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
