import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StandingMatchesComponent } from './standing-matches.component';

describe('StandingMatchesComponent', () => {
  let component: StandingMatchesComponent;
  let fixture: ComponentFixture<StandingMatchesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StandingMatchesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StandingMatchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
