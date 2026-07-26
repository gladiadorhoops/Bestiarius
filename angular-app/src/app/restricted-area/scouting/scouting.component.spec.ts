import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoutingComponent } from './scouting.component';

describe('ScoutingComponent', () => {
  let component: ScoutingComponent;
  let fixture: ComponentFixture<ScoutingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScoutingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScoutingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
