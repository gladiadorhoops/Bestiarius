import { Component, Input } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Team } from '../interfaces/team';
import { Player } from '../interfaces/player';
import { DynamoDb } from '../aws-clients/dynamodb';
import { TeamBuilder } from '../Builders/team-builder';
import { PlayerBuilder } from '../Builders/player-builder';
import { LocalizedStrings } from '../interfaces/reporte';


@Component({
  selector: 'app-evaluacion',
  templateUrl: './evaluacion.component.html',
  styleUrls: ['./evaluacion.component.scss']
})
export class EvaluacionComponent {

  constructor(private fb: FormBuilder,
    private authService: AuthService,
    private teamBuilder: TeamBuilder,
    private playerBuilder: PlayerBuilder,
  ) {}

  @Input() ddb!: DynamoDb;
  teams: Team[] = [];

  async ngOnInit() {
    let teams = await this.teamBuilder.getListOfTeams(this.ddb).then(
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
    playerid: ["", Validators.required],
    equipo: ["", Validators.required],
    position1: [false],
    position2: [false],
    position3: [false],
    position4: [false],
    position5: [false],
    eval: ['0'],
    [`tiro-${LocalizedStrings.tiros.colada}`]: ['0'],
    [`tiro-${LocalizedStrings.tiros.media}`]: ['0'],
    [`tiro-${LocalizedStrings.tiros.triples}`]: ['0'],
    [`tiro-${LocalizedStrings.tiros.Inteligencia}`]: ['0'],
    [`pase-${LocalizedStrings.pases.vision}`]: ['0'],
    [`pase-${LocalizedStrings.pases.creador}`]: ['0'],
    [`pase-${LocalizedStrings.pases.perdida}`]: ['0'],
    [`pase-${LocalizedStrings.pases.sentido}`]: ['0'],
    [`defensa-${LocalizedStrings.defensas.conBola}`]: ['0'],
    [`defensa-${LocalizedStrings.defensas.sinBola}`]: ['0'],
    [`defensa-${LocalizedStrings.defensas.transicion}`]: ['0'],
    [`defensa-${LocalizedStrings.defensas.rebote}`]: ['0'],
    [`bote-${LocalizedStrings.botes.control}`]: ['0'],
    [`bote-${LocalizedStrings.botes.presion}`]: ['0'],
    [`bote-${LocalizedStrings.botes.perdida}`]: ['0'],
    [`bote-${LocalizedStrings.botes.manoDebil}`]: ['0'],
    [`bote-${LocalizedStrings.botes.ritmo}`]: ['0'],
    [`jugador-${LocalizedStrings.jugadores.hustle}`]: ['0'],
    [`jugador-${LocalizedStrings.jugadores.spacing}`]: ['0'],
    [`jugador-${LocalizedStrings.jugadores.juegoEquipo}`]: ['0'],
    [`jugador-${LocalizedStrings.jugadores.tiroInteligente}`]: ['0'],
    [`jugador-${LocalizedStrings.jugadores.agresividad}`]: ['0'],
    [`estilo-${LocalizedStrings.estilos.anotador}`]: [false],
    [`estilo-${LocalizedStrings.estilos.defensor}`]: [false],
    [`estilo-${LocalizedStrings.estilos.creador}`]: [false],
    [`estilo-${LocalizedStrings.estilos.atletico}`]: [false],
    [`estilo-${LocalizedStrings.estilos.clutch}`]: [false],
    [`estilo-${LocalizedStrings.estilos.rebotador}`]: [false],
    [`estilo-${LocalizedStrings.estilos.rol}`]: [false],
    nominacion: [''],
  });

  onSubmit() {
    // TODO: Use EventEmitter with form value
    console.warn(this.evaluationForm.value);
  }

  teamplayers: Player[] = []
  
  selectedEdad : String = ""
  selectedCategoria: String = ""
  
  async loadPlayers() {
    var selectedTeam = this.evaluationForm.value.equipo;
    this.teams.forEach(
      async (team) => {
        if(team.name == selectedTeam){
          this.teamplayers = await this.playerBuilder.getPlayersByTeam(this.ddb, team.id!).then(
            (players) => {
              return players
            }
          )
        }
    });
  }
  loadPlayerDetails() {
    var selectedPlayer = this.evaluationForm.value.playerid;

    var selectedteamplayer: Player = {id: '', equipo: '', nombre:'',edad:"",categoria:''};
    this.teamplayers.forEach(function(value){
      if(value.id == selectedPlayer){
        selectedteamplayer = value;
      }
    });
    this.selectedEdad = selectedteamplayer.edad;
    this.selectedCategoria = selectedteamplayer.categoria;
  }
  
  positions: string[] = ["1", "2", "3", "4", "5"]
  evalGens = [
    {id: "1", desc: "Necesita mejora"}, 
    {id: "2", desc: "Promedio"}, 
    {id: "3", desc: "Arriba de promedio"}, 
    {id: "4", desc: "Muy Bueno"}, 
    {id: "5", desc: "Gladiador"}
  ]
  tiros: string[] = LocalizedStrings.getTiros()
  pases: string[] = LocalizedStrings.getPases()
  defensas: string[] = LocalizedStrings.getDefensas()
  botes: string[] = LocalizedStrings.getBotes()
  jugadores: string [] = LocalizedStrings.getJugadores()
  estilos: string[] = LocalizedStrings.getEstilos()
}

