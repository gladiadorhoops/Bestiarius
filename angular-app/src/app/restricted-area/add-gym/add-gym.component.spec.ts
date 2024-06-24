import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddGymComponent } from './add-gym.component';

describe('AddGymComponent', () => {
  let component: AddGymComponent;
  let fixture: ComponentFixture<AddGymComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddGymComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddGymComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
