import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GrantMap } from './grant-map';

describe('GrantMap', () => {
  let component: GrantMap;
  let fixture: ComponentFixture<GrantMap>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GrantMap]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GrantMap);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
