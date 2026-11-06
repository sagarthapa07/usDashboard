import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyGrant } from './my-grant';

describe('MyGrant', () => {
  let component: MyGrant;
  let fixture: ComponentFixture<MyGrant>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyGrant]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyGrant);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
