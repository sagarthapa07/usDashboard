import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadList } from './download-list';

describe('DownloadList', () => {
  let component: DownloadList;
  let fixture: ComponentFixture<DownloadList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DownloadList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
