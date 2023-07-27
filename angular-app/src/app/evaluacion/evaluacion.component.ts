import { Component, Input } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Team, getCategories } from '../interfaces/team';
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

  scout_id = this.authService.getScoutId();
  scout_name = this.authService.getScoutName();
  categories = getCategories();
  evaluationForm =  this.fb.group(ReporteBuilder.defaultForm);

  teams: Team[] = [];
  teamplayers: Player[] = [];
  selectedEdad : string = "";
  selectedCategoria: string = "";
  displayStyle = "none";
  submitReportMessage = "Evaluacion guardada!"

  positions: Skill[] = Skills.getPosiciones()
  tiros: Skill[] = Skills.getTiros()
  pases: Skill[] = Skills.getPases()
  defensas: Skill[] = Skills.getDefensas()
  botes: Skill[] = Skills.getBotes()
  jugadores: Skill [] = Skills.getJugadores()
  estilos: Skill[] = Skills.getEstilos()
  evalGens: Skill[] = Skills.getEvaluaciones()
  nominaciones: Skill[] = Skills.getNominaciones()

  async ngOnInit() {
  }

  async onSubmit() {
    // TODO: Use EventEmitter with form value
    console.log(this.evaluationForm.value);

    try {
      await this.reporteBuilder.submit(this.ddb, this.evaluationForm)
    } catch (err) {
      this.submitReportMessage = `Error gurardong evaluacion. Contacta a Paco.\n${err}`
      console.error("Error Submitting report")
    }
    
    this.openPopup();
  }

  async loadTeams() {
    this.teams = []
    this.selectedCategoria = this.evaluationForm.value.categoria!
    let teams = await this.teamBuilder.getListOfTeams(this.ddb, this.selectedCategoria).then(
      (output) => {
        return output
      }
    )
    this.teams = this.teams.concat(teams)
  }

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

    let scout = {
      id: this.scout_id,
      nombre: this.scout_name
    }

    this.evaluationForm = await this.reporteBuilder.getReport(
      this.ddb, scout, selectedteamplayer.id, this.evaluationForm.value.equipo!, this.selectedCategoria
    )
  }

  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    this.displayStyle = "none";
  }
}

