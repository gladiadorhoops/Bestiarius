import { Component, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Team, getCategories } from '../interfaces/team';
import { Player } from '../interfaces/player';
import { DynamoDb } from '../aws-clients/dynamodb';
import { TeamBuilder } from '../Builders/team-builder';
import { PlayerBuilder } from '../Builders/player-builder';
import { AddPlayerComponent } from '../add-player/add-player.component';
import {v4 as uuidv4} from 'uuid';
import { Coach } from '../interfaces/coach';
import { UserBuilder } from '../Builders/user-builder';


@Component({
  selector: 'app-add-team',
  templateUrl: './add-team.component.html',
  styleUrls: ['./add-team.component.scss']
})
export class AddTeamComponent {

  constructor(private fb: FormBuilder,
    private authService: AuthService,
    private teamBuilder: TeamBuilder,
    private userBuilder: UserBuilder,
    private playerBuilder: PlayerBuilder,
  ) {
    this.userrole = this.authService.getUserRole();

  }

  @Input() ddb!: DynamoDb;

  userId = this.authService.getUserId();
  userName = this.authService.getUserName();
  categories = getCategories();
  teamForm =  this.fb.group({
    coachId: ['', Validators.required],
    teamName: ['', Validators.required],
    category: ['', Validators.required],
    location: [''],
    captainId: ['']
  });
  userrole: string;

  coaches: Coach[] = [];
  teams: Team[] = [];
  teamplayers: Player[] = [];
  selectedCaptan : boolean = false;

  selectedCategoria: string = "";
  selectedTeamName: string = "";
  selectedTeamId: string = "";
  popUpMsg = "";
  displayStyle = "none";

  async ngOnInit() {
    if(this.userrole != "coach"){
      this.coaches = await this.userBuilder.getCoaches(this.ddb);
    }

  }

  @ViewChildren(AddPlayerComponent) viewChildren!: QueryList<AddPlayerComponent>;


  async loadTeams() {
    this.teams = []
    this.selectedCategoria = this.teamForm.value.category!
    let teams = await this.teamBuilder.getTeamsByCategory(this.ddb, this.selectedCategoria).then(
      (output) => {
        return output
      }
    )

    this.teams = this.teams.concat(teams)

  }

  async loadPlayers() {
    this.selectedTeamName = this.teamForm.value.teamName!;
    this.selectedCategoria = this.teamForm.value.category!
    console.log(this.selectedTeamName);
    console.log(this.selectedCategoria);
    var playersLoaded = false;
    this.teams.forEach(
      async (team) => {
        if(team.name == this.selectedTeamName){
          this.selectedTeamId = team.id;
          this.teamplayers = await this.playerBuilder.getPlayersByTeam(this.ddb, team.id!).then(
            (players) => {
              return players;
            }
          );
          playersLoaded = true;
        }
    });
    if(!playersLoaded){
      this.teamplayers = [];
      this.selectedTeamId = uuidv4();
    }

  }

  addPlayer() {
    this.teamplayers.unshift({
      id: uuidv4(),
      name: "",
      team: this.selectedTeamId,
      category: this.selectedCategoria,
      age: "",
      height: "",
      weight: "",
      position: "",
      birthday: undefined
    }); 

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

    let selectedCoachId = this.userId;
    let selectedCoachName = this.userName;
    if(this.userrole != "coach"){
      selectedCoachId = this.teamForm.value.coachId!;
      let selectedCoach = this.coaches.filter((c)=>c.id === selectedCoachId);
      if(selectedCoach.length != 1){
        this.popUpMsg = "Coach not found!";
        this.openPopup();
        return;
      }
      selectedCoachName = selectedCoach[0].name!;
    }

    let newTeam : Team = {id: this.selectedTeamId,
      name: this.selectedTeamName,
      captainId: this.teamForm.value.captainId == null ? "" : this.teamForm.value.captainId,
      coachId: selectedCoachId,
      coachName: selectedCoachName,
      category: this.selectedCategoria,
      location: this.teamForm.value.location == null ? "" : this.teamForm.value.location
    }

    await this.teamBuilder.createTeam(this.ddb, newTeam);

    updatedPlayers.forEach(player => {
      this.playerBuilder.createPlayer(this.ddb, player).then(()=> {
        console.log("Saved "+player.name);
      });
    });

    this.popUpMsg = "Team Saved!";
    this.openPopup();

  }

  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    this.callParentToListTeam();
    this.displayStyle = "none";
  }


  @Output() callListTeam = new EventEmitter<string>();

  callParentToListTeam() {
    this.callListTeam.emit('callListTeam');
  }
}

