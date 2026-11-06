import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceCard } from './resource-card';

describe('ResourceCard', () => {
  let component: ResourceCard;
  let fixture: ComponentFixture<ResourceCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
