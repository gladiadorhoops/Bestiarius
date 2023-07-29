import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MatchEditorComponent } from './match-editor.component';

describe('MatchEditorComponent', () => {
  let component: MatchEditorComponent;
  let fixture: ComponentFixture<MatchEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MatchEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MatchEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
