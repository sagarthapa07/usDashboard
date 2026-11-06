import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyArchives } from './my-archives';

describe('MyArchives', () => {
  let component: MyArchives;
  let fixture: ComponentFixture<MyArchives>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyArchives]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyArchives);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
