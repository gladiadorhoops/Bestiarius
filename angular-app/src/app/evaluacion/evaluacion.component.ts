import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { FormArray } from '@angular/forms';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-evaluacion',
  templateUrl: './evaluacion.component.html',
  styleUrls: ['./evaluacion.component.scss']
})
export class EvaluacionComponent {
  evaluationForm = this.fb.group({
    nombre: ['', Validators.required],
    numero: ['', Validators.required],
    categoria: new FormControl("", Validators.required),
    equipo: new FormControl("", Validators.required),
    aliases: this.fb.array([
      this.fb.control('')
    ])
  });

  get aliases() {
    return this.evaluationForm.get('aliases') as FormArray;
  }

  constructor(private fb: FormBuilder) { }

  updateProfile() {
    this.evaluationForm.patchValue({
      nombre: 'Nancy'
    });
  }

  addAlias() {
    this.aliases.push(this.fb.control(''));
  }

  onSubmit() {
    // TODO: Use EventEmitter with form value
    console.warn(this.evaluationForm.value);
  }
}



