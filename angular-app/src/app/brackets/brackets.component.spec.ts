import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BracketsComponent } from './brackets.component';

describe('BracketsComponent', () => {
  let component: BracketsComponent;
  let fixture: ComponentFixture<BracketsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BracketsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BracketsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
