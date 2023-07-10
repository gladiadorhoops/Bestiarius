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
    categoria: new FormControl("", Validators.required),
    equipo: new FormControl("", Validators.required),
    edad: [''],
    estatura: [''],
    peso: [''],
    position: [''],
    eval: [''],
    tiroColada: [''],
    tiroTiro_Media: [''],
    tiroTriples: [''],
    tiroTiro_Inteligente: [''],
    paseVision: [''],
    paseCreador: [''],
    pasePerdida_de_Balon: [''],
    paseSentido: [''],
    defensaEn_Bola: [''],
    defensaSin_Bola: [''],
    defensaTransicion: [''],
    defensaRebote_Def: [''],
    boteControl: [''],
    boteEn_Presion: [''],
    botePerdida_de_Balon: [''],
    boteMano_Debil: [''],
    boteCambio_de_Ritmo: [''],
    jugadorHustle: [''],
    jugadorSpacing: [''],
    jugadorJuego_de_Equipo: [''],
    jugadorTiro_Inteligente: [''],
    jugadorAgresividad: [''],
    estilo: [''],
    nominacion: [''],
  });

  constructor(private fb: FormBuilder) { }

  updateProfile() {
    this.evaluationForm.patchValue({
      nombre: 'Nancy'
    });
  }

  onSubmit() {
    // TODO: Use EventEmitter with form value
    console.warn(this.evaluationForm.value);
  }


  positions: string[] = ["1", "2", "3", "4", "5"]
  evalGens = [
    {id: "1", desc: "Necesita mejora"}, 
    {id: "2", desc: "Promedio"}, 
    {id: "3", desc: "Arriba de promedio"}, 
    {id: "4", desc: "Muy Bueno"}, 
    {id: "5", desc: "Gladiador"}
  ]
  tiros: string[] = ["Colada", "Tiro_Media", "Triples", "Tiro_Inteligente"]
  pases: string[] = ["Vision", "Creador", "Perdida_de_Balon", "Sentido"]
  defensas: string[] = ["En_Bola", "Sin_Bola", "Transicion", "Rebote_Def"]
  botes: string[] = ["Control", "En_Presion", "Perdida_de_Balon", "Mano_Debil", "Cambio_de_Ritmo"]
  jugadors: string[] = ["Hustle", "Spacing", "Juego_de_Equipo", "Tiro_Inteligente", "Agresividad"]
  estilos: string[] = ["Anotador", "Defensor", "Creador", "Atletico", "Clutch", "Rebotador", "Rol"]
}

