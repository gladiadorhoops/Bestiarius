import { Component, Input, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Team, getCategories } from '../interfaces/team';
import { Player } from '../interfaces/player';
import { DynamoDb } from '../aws-clients/dynamodb';
import { TeamBuilder } from '../Builders/team-builder';
import { PlayerBuilder } from '../Builders/player-builder';
import { ReporteBuilder } from '../Builders/reporte-builder';
import { Skills, Skill } from '../interfaces/reporte';
import { Scout } from '../interfaces/scout';
import { AddPlayerComponent } from '../add-player/add-player.component';
import {v4 as uuidv4} from 'uuid';


@Component({
  selector: 'app-add-team',
  templateUrl: './add-team.component.html',
  styleUrls: ['./add-team.component.scss']
})
export class AddTeamComponent {

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
  teamForm =  this.fb.group(TeamBuilder.defaultForm);

  teams: Team[] = [];
  teamplayers: Player[] = [];
  selectedCaptan : boolean = false;

  selectedCategoria: string = "";
  selectedTeam: string = "";
  displayStyle = "none";
  submitReportMessage = "Evaluacion guardada!"

  async ngOnInit() {
  }

  @ViewChildren(AddPlayerComponent) viewChildren!: QueryList<AddPlayerComponent>;


  async loadTeams() {
    this.teams = []
    this.selectedCategoria = this.teamForm.value.categoria!
    let teams = await this.teamBuilder.getListOfTeams(this.ddb, this.selectedCategoria).then(
      (output) => {
        return output
      }
    )

    this.teams = this.teams.concat(teams)

  }

  async loadPlayers() {
    this.selectedTeam = this.teamForm.value.equipo!;
    var playersLoaded = false;
    this.teams.forEach(
      async (team) => {
        if(team.name == this.selectedTeam){
          this.teamplayers = await this.playerBuilder.getPlayersByTeam(this.ddb, team.id!).then(
            (players) => {
              return players;
            }
          )
          playersLoaded = true;
        }
    });
    if(!playersLoaded){
      this.teamplayers = [];
    }

  }

  addPlayer() {
    this.teamplayers.unshift({
      id: "player."+uuidv4(),
      nombre: "",
      equipo: this.selectedTeam,
      categoria: this.selectedCategoria,
      edad: "",
      height: "",
      weight: "",
      posicion: "",
      birthday: new Date()
    }); 

    //this.viewChildren.forEach(element => {
    //  element.loadPlayerDetails(this.teamplayers);
    //});
  }


  async onSubmit() {
    // TODO: Use EventEmitter with form value

    this.viewChildren.forEach(element => {
      element.savePlayer();
    });

    /*try {
      await this.reporteBuilder.submit(this.ddb, this.teamForm)
    } catch (err) {
      this.submitReportMessage = `Error gurardong evaluacion. Contacta a Paco.\n${err}`
      console.error("Error Submitting report")
    }
    
    this.openPopup();
    */
  }

  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    this.displayStyle = "none";
  }
}

