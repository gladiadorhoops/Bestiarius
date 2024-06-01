import { Component, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';
import { AuthService } from '../../auth.service';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { TeamBuilder } from '../../Builders/team-builder';
import { Team, getCategories } from '../../interfaces/team';
import { Player } from '../../interfaces/player';
import { PlayerBuilder } from '../../Builders/player-builder';
import { formatDate } from "@angular/common";
import { FormBuilder, FormGroup } from '@angular/forms';
import {v4 as uuidv4} from 'uuid';
import { AddPlayerComponent } from '../add-team/add-player/add-player.component';
import { Coach } from '../../interfaces/coach';
import { UserBuilder } from '../../Builders/user-builder';

@Component({
  selector: 'app-view-teams',
  templateUrl: './view-teams.component.html',
  styleUrls: ['./view-teams.component.scss']
})
export class ViewTeamsComponent {

  displayConfirmDeletePlayer = "none";
  displayConfirmDeleteTeam = "none";
  displayAddPlayer = "none";
  displayPlayer = "none";
  displayEditTeam = "none";

  constructor(private fb: FormBuilder,
    private authService: AuthService,
    private teamBuilder: TeamBuilder,
    private userBuilder: UserBuilder,
    private playerBuilder: PlayerBuilder
  ){
    this.selectedPlayer=this.playerBuilder.getEmptyPlayer();
  }

  @Input() ddb!: DynamoDb;

  loading = true;
  team: Team | undefined;
  players: Player[] = [];
  coaches: Coach[] = [];
  categories = getCategories();
  deleteForm : FormGroup = this.fb.group({teamToDelete: ''});
  deletePlayerForm : FormGroup = this.fb.group({playerToDelete: ''});
  editForm : FormGroup = this.fb.group({coachId: '', category: '', teamName: '', location: '', captainId: ''});
  selectedPlayer: Player;

  errorMsg = "";
  isAdmin = false;
  isScout = false;
  isCoach = false;
  userId = "";
  userrole = "";
  newplayerid = uuidv4();

  editable = true;
  
  reloadLoginStatus() {
    this.userrole = this.authService.getUserRole();
    this.userId = this.authService.getUserId();
    
    this.isAdmin = false;
    this.isScout = false;
    this.isCoach = false;

    if(this.userrole == "admin"){
      this.isAdmin = true;
      this.isScout = true;
      this.isCoach = true;
    }
    if(this.userrole == "scout"){
      this.isAdmin = true;
    }
    if(this.userrole == "coach"){
      this.isCoach = true;
    }
  }

  async ngOnInit() {
    if(this.userrole != "coach"){
      this.coaches = await this.userBuilder.getCoaches(this.ddb);
    }
    
    this.reloadLoginStatus();
  }
  
  async loadTeam(teamId: string){
    this.loading = true;
    this.team = await this.teamBuilder.getTeam(this.ddb, teamId);
    this.players = await this.playerBuilder.getPlayersByTeam(this.ddb, teamId);
    this.loading = false;
  }

  @Output() callListTeam = new EventEmitter<string>();

  callParentToListTeams() {
    this.callListTeam.emit('callListTeam');
  }

  removeTeam(){
    this.displayConfirmDeleteTeam = "block";
  }

  closePopup() {
    this.displayConfirmDeleteTeam = "none";
    this.errorMsg = "";
    this.deleteForm.get("teamToDelete")?.reset();
  }
  async confirmDeleteTeam() {
    if(this.team!.name == this.deleteForm.value.teamToDelete ){
      await this.playerBuilder.deletePlayersByTeam(this.ddb, this.team!.id);
      await this.teamBuilder.deleteTeam(this.ddb, this.team!.id);
      this.displayConfirmDeleteTeam = "none";
      this.errorMsg = "";
      this.callParentToListTeams();
    }
    else{
      this.errorMsg = "Nombre del equipo no coincide!";
    }
  }

  openEditTeam(){
    //category: '', teamName: '', location: '', captainId: ''});
    this.editForm.get('coachId')?.setValue(this.team!.coachId);
    this.editForm.get('category')?.setValue(this.team!.category);
    this.editForm.get('teamName')?.setValue(this.team!.name);
    this.editForm.get('location')?.setValue(this.team!.location);
    this.editForm.get('captainId')?.setValue(this.team!.captainId);
    this.displayEditTeam = "block";
  }

  closeEditPopup(){
    this.displayEditTeam = "none";
  }

  async confirmEditTeam(){
    let val = this.editForm.value;

    this.team = {id: this.team?.id!,
      name: val.teamName,
      captainId: val.captainId,
      coachId: val.coachId,
      coachName: this.coaches.filter((c)=>c.id === val.coachId)[0].name,
      category: val.category,
      location: val.location
    }

    await this.teamBuilder.createTeam(this.ddb, this.team);
    this.loadTeam(this.team?.id);
    this.displayEditTeam = "none";
  }

  getDate(birthday: Date){
    return formatDate(birthday, 'dd/MM/yyyy', 'en-US')
  }

  viewPlayer(playerId: string){
    console.log("View player "+playerId);
    this.selectedPlayer = (this.players.filter((p)=>p.id === playerId))[0];
    
    this.displayPlayer = "block";
  }
  closePlayer(){
    this.displayPlayer = "none";
  }

  deletePlayer(){
    this.displayConfirmDeletePlayer = "block"
  }
  closeDeletePlayerPopup() {
    this.displayConfirmDeletePlayer = "none";
    this.errorMsg = "";
    this.deletePlayerForm.get("playerToDelete")?.reset();
  }
  async confirmDeletePlayer() {
    if(this.selectedPlayer!.name == this.deletePlayerForm.value.playerToDelete ){
      await this.playerBuilder.deletePlayer(this.ddb, this.selectedPlayer!.id);
      this.displayConfirmDeletePlayer = "none";
      this.errorMsg = "";
      this.loadTeam(this.team!.id);
      this.closePlayer();
    }
    else{
      this.errorMsg = "Nombre del jugador no coincide!";
    }
  }

  async addPlayer(){
    await this.viewChildren.forEach(element => {
      element.loadPlayer(this.newplayerid);
    });
    this.displayAddPlayer = "block"
  }
  closeAddPlayerPopup() {
    this.displayAddPlayer = "none";
    this.newplayerid = uuidv4();
  }

  @ViewChildren(AddPlayerComponent) viewChildren!: QueryList<AddPlayerComponent>;
  async getInputPlayer(){
    let newPlayer: Player = this.playerBuilder.getEmptyPlayer();
    await this.viewChildren.forEach(element => {
      element.savePlayer();
      console.log("updated player:");
      console.log(element.player);
      newPlayer = element.player;
    });
    return newPlayer;
  }

  async confirmAddPlayer() {
    let newPlayer = await this.getInputPlayer()
    this.playerBuilder.createPlayer(this.ddb, newPlayer).then(()=> {
      console.log("Saved "+newPlayer.name);
    });
    this.loadTeam(this.team!.id);
    this.newplayerid = uuidv4();
    this.displayAddPlayer = "none";
    this.closePlayer();
  }

  async editPlayer() {
    this.newplayerid = this.selectedPlayer.id;
    await this.viewChildren.forEach(element => {
      element.loadPlayer(this.newplayerid);
    });
    this.addPlayer();
  }
}
