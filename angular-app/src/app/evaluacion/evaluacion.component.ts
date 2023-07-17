import { Component, Input } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Team } from '../interfaces/team';
import { Player } from '../interfaces/player';
import { DynamoDb } from '../aws-clients/dynamodb';
import { TeamBuilder } from '../Builders/team-builder';
import { PlayerBuilder } from '../Builders/player-builder';
import { ReporteBuilder } from '../Builders/reporte-builder';
import { Skills, Skill } from '../interfaces/reporte';


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
    private reporteBuilder: ReporteBuilder,
  ) {}

  @Input() ddb!: DynamoDb;
  teams: Team[] = [];

  async ngOnInit() {
    let teams = await this.teamBuilder.getListOfTeams(this.ddb).then(
      (output) => {
        return output
      }
    )
    this.teams = this.teams.concat(teams)
  }

  scout_id = this.authService.getScoutId()
  scout_name = this.authService.getScoutName()

  evaluationForm =  this.fb.group(ReporteBuilder.defaultForm);

  onSubmit() {
    // TODO: Use EventEmitter with form value
    console.log(this.evaluationForm.value);
    this.reporteBuilder.submit(this.ddb, this.evaluationForm)
    this.openPopup();
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
  async loadPlayerDetails() {
    var selectedPlayer = this.evaluationForm.value.playerId;

    var selectedteamplayer: Player = {id: '', equipo: '', nombre:'',edad:"",categoria:''};
    this.teamplayers.forEach(function(value){
      if(value.id == selectedPlayer){
        selectedteamplayer = value;
      }
    });
    this.selectedEdad = selectedteamplayer.edad;
    this.selectedCategoria = selectedteamplayer.categoria;

    let scout = {
      id: this.scout_id,
      nombre: this.scout_name
    }

    this.evaluationForm = await this.reporteBuilder.getReport(this.ddb, scout, selectedteamplayer.id, this.evaluationForm.value.equipo!)
  }

  positions: Skill[] = Skills.getPocisiones()
  tiros: Skill[] = Skills.getTiros()
  pases: Skill[] = Skills.getPases()
  defensas: Skill[] = Skills.getDefensas()
  botes: Skill[] = Skills.getBotes()
  jugadores: Skill [] = Skills.getJugadores()
  estilos: Skill[] = Skills.getEstilos()
  evalGens: Skill[] = Skills.getEvaluaciones()
  nominaciones: Skill[] = Skills.getNominaciones()

  displayStyle = "none";
  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    this.displayStyle = "none";
  }
}

