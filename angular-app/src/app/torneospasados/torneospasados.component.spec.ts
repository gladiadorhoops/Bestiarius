import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TorneospasadosComponent } from './torneospasados.component';

describe('TorneospasadosComponent', () => {
  let component: TorneospasadosComponent;
  let fixture: ComponentFixture<TorneospasadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TorneospasadosComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TorneospasadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
