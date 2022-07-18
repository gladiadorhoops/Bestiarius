import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurismoComponent } from './turismo.component';

describe('TurismoComponent', () => {
  let component: TurismoComponent;
  let fixture: ComponentFixture<TurismoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TurismoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TurismoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
