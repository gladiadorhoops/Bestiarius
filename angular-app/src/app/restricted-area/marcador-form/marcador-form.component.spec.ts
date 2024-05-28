import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarcadorFormComponent } from './marcador-form.component';

describe('MarcadorFormComponent', () => {
  let component: MarcadorFormComponent;
  let fixture: ComponentFixture<MarcadorFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarcadorFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarcadorFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
