import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EvaluarPartidoComponent } from './evaluar-partido.component';

describe('EvaluarPartidoComponent', () => {
  let component: EvaluarPartidoComponent;
  let fixture: ComponentFixture<EvaluarPartidoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EvaluarPartidoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EvaluarPartidoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
