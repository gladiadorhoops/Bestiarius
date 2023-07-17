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
import { Skills, Skill, Section } from '../interfaces/reporte';


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
    [`${Section.TIROS}-${Skills.tiros['colada'].report}`]: ['0'],
    [`${Section.TIROS}-${Skills.tiros['media'].report}`]: ['0'],
    [`${Section.TIROS}-${Skills.tiros['triples'].report}`]: ['0'],
    [`${Section.TIROS}-${Skills.tiros['inteligencia'].report}`]: ['0'],
    [`${Section.PASE}-${Skills.pases.vision.report}`]: ['0'],
    [`${Section.PASE}-${Skills.pases.creador.report}`]: ['0'],
    [`${Section.PASE}-${Skills.pases.perdida.report}`]: ['0'],
    [`${Section.PASE}-${Skills.pases.sentido.report}`]: ['0'],
    [`${Section.DEFENSA}-${Skills.defensas.conBola.report}`]: ['0'],
    [`${Section.DEFENSA}-${Skills.defensas.sinBola.report}`]: ['0'],
    [`${Section.DEFENSA}-${Skills.defensas.transicion.report}`]: ['0'],
    [`${Section.DEFENSA}-${Skills.defensas.rebote.report}`]: ['0'],
    [`${Section.BOTE}-${Skills.botes.control.report}`]: ['0'],
    [`${Section.BOTE}-${Skills.botes.presion.report}`]: ['0'],
    [`${Section.BOTE}-${Skills.botes.perdida.report}`]: ['0'],
    [`${Section.BOTE}-${Skills.botes.manoDebil.report}`]: ['0'],
    [`${Section.BOTE}-${Skills.botes.ritmo.report}`]: ['0'],
    [`${Section.JUGADOR}-${Skills.jugadores.hustle.report}`]: ['0'],
    [`${Section.JUGADOR}-${Skills.jugadores.spacing.report}`]: ['0'],
    [`${Section.JUGADOR}-${Skills.jugadores.juegoEquipo.report}`]: ['0'],
    [`${Section.JUGADOR}-${Skills.jugadores.tiroInteligente.report}`]: ['0'],
    [`${Section.JUGADOR}-${Skills.jugadores.agresividad.report}`]: ['0'],
    [`${Section.ESTILO}-${Skills.estilos.anotador.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilos.defensor.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilos.creador.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilos.atletico.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilos.clutch.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilos.rebotador.report}`]: [false],
    [`${Section.ESTILO}-${Skills.estilos.rol.report}`]: [false],
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
  tiros: Skill[] = Skills.getTiros()
  pases: Skill[] = Skills.getPases()
  defensas: Skill[] = Skills.getDefensas()
  botes: Skill[] = Skills.getBotes()
  jugadores: Skill [] = Skills.getJugadores()
  estilos: Skill[] = Skills.getEstilos()
}

