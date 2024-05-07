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

  scout_id = this.authService.getUserId();
  scout_name = this.authService.getUserName();
  categories = getCategories();
  teamForm =  this.fb.group(TeamBuilder.defaultForm);

  teams: Team[] = [];
  teamplayers: Player[] = [];
  selectedCaptan : boolean = false;

  selectedCategoria: string = "";
  selectedTeam: string = "";
  popUpMsg = "";
  displayStyle = "none";

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

  async getInputPlayersList(){
    let updatedPlayers: Player[] = [];
    await this.viewChildren.forEach(element => {
      element.savePlayer();
      console.log("updated player:");
      console.log(element.player);
      updatedPlayers = updatedPlayers.concat(element.player);
    });
    return updatedPlayers;
  }

  async refreshPlayersList(){
    console.log("Players list:");
    this.teamplayers = await this.getInputPlayersList();
    console.log(this.teamplayers);

    if(this.teamplayers.length == 0){
      this.popUpMsg = "Jugadores no encontrados. Agrega jugadores para continuar.";
      this.openPopup();
    }
  }

  async onSubmit() {
    let updatedPlayers = await this.getInputPlayersList();
    console.log("Players to save");
    console.log(updatedPlayers);

    // TODO: refresh database with team data

    /*try {
      await this.reporteBuilder.submit(this.ddb, this.teamForm)
    } catch (err) {
      this.submitReportMessage = `Error gurardong evaluacion. Contacta a Paco.\n${err}`
      console.error("Error Submitting report")
    }
    this.popUpMsg = "Evaluacion guardada!";
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

