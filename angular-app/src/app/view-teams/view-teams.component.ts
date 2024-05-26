import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../auth.service';
import { DynamoDb } from '../aws-clients/dynamodb';
import { TeamBuilder } from '../Builders/team-builder';
import { Team } from '../interfaces/team';
import { Player } from '../interfaces/player';
import { PlayerBuilder } from '../Builders/player-builder';
import { formatDate } from "@angular/common";
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-view-teams',
  templateUrl: './view-teams.component.html',
  styleUrls: ['./view-teams.component.scss']
})
export class ViewTeamsComponent {

  displayStyle = "none";

  constructor(private fb: FormBuilder,
      private authService: AuthService,
      private teamBuilder: TeamBuilder,
      private playerBuilder: PlayerBuilder
    ){}

    @Input() ddb!: DynamoDb;

  loading = true;
  team: Team | undefined;
  players: Player[] = [];
  deleteForm : FormGroup = this.fb.group({teamToDelete: ''});

  errorMsg = "";
  isAdmin = false;
  isScout = false;
  isCoach = false;
  userId = "";
  userrole = "";
  
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
    this.displayStyle = "block";
  }

  closePopup() {
    this.displayStyle = "none";
    this.errorMsg = "";
    this.deleteForm.get("teamToDelete")?.reset();
  }
  async confirmDelete() {
    if(this.team!.name == this.deleteForm.value.teamToDelete ){
      await this.playerBuilder.deletePlayersByTeam(this.ddb, this.team!.id);
      await this.teamBuilder.deleteTeam(this.ddb, this.team!.id);
      this.callParentToListTeams();
    }
    else{
      this.errorMsg = "Nombre del equipo no coincide!";
    }
  }

  getDate(birthday: Date){
    return formatDate(birthday, 'dd/MM/yyyy', 'en-US')
  }
}
