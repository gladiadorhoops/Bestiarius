import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultadosEvaluacionComponent } from './resultados-evaluacion.component';

describe('ResultadosEvaluacionComponent', () => {
  let component: ResultadosEvaluacionComponent;
  let fixture: ComponentFixture<ResultadosEvaluacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResultadosEvaluacionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResultadosEvaluacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
