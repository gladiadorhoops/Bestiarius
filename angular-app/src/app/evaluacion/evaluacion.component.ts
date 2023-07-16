import { Component, Input } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Team } from '../interfaces/team';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDb } from '../aws-clients/dynamodb';
import { TeamBuilder } from '../Builders/team-builder';


@Component({
  selector: 'app-evaluacion',
  templateUrl: './evaluacion.component.html',
  styleUrls: ['./evaluacion.component.scss']
})
export class EvaluacionComponent {

  constructor(private fb: FormBuilder,
    private authService: AuthService) {
    this.teamBuidler = new TeamBuilder()
  }

  @Input() ddb!: DynamoDb;
  teamBuidler: TeamBuilder;
  teams: Team[] = [];

  async ngOnInit() {
    let teams = await this.teamBuidler.getListOfTeams(this.ddb).then(
      (output) => {
        console.log("Component output", output)
        return output
      }
    )
    this.teams = this.teams.concat(teams)
  }

  scout_id = this.authService.getScoutId()
  scout_name = this.authService.getScoutName()

  evaluationForm = this.fb.group({
    scoutid: [this.scout_id, Validators.required],
    scoutname: [this.scout_name, Validators.required],
    nombre: ['', Validators.required],
    categoria: new FormControl(""),
    equipo: ["", Validators.required],
    edad: [''],
    //estatura: [''],
    //peso: [''],
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

  onSubmit() {
    // TODO: Use EventEmitter with form value
    console.warn(this.evaluationForm.value);
  }

  teamplayers: string[] = ["Daniel", "Luis", "Carlos"]
  
  loadPlayers() {
    var selectedTeam = this.evaluationForm.value.equipo;
    var selectedteamplayers: string[] = [];
    this.teams.forEach(function(value){
      if(value.name == selectedTeam){
        // selectedteamplayers = value.players;
      }
    });
    this.teamplayers = selectedteamplayers;
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

