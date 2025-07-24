import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuthService } from '../auth.service';
import { DynamoDb } from '../aws-clients/dynamodb';
import { TeamBuilder } from '../Builders/team-builder';
import { Team } from '../interfaces/team';
import { PlayerBuilder } from '../Builders/player-builder';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { COGNITO_UNAUTHENTICATED_CREDENTIALS, REGION } from '../aws-clients/constants';
import { Player } from '../interfaces/player';

@Component({
  selector: 'app-participants',
  templateUrl: './participants.component.html',
  styleUrls: ['./participants.component.scss']
})
export class ParticipantsComponent implements OnInit {
  ddbClient = new DynamoDBClient({ 
    region: REGION,
    credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS
  }); 
  
  constructor(
    private authService: AuthService,
    private teamBuilder: TeamBuilder,
    private playerBuilder: PlayerBuilder
  ){}
  
  
  ddb: DynamoDb =  new DynamoDb(this.ddbClient);
  loading = true;
  available = true;
  teams: Team[] = [];
  team: Team | undefined;
  players: Player[] = [];
  displayPlayers = "none;"


  async refreshTeams(){
    
    this.teams = await this.teamBuilder.getTeams(this.ddb);
    this.sortTeamsByCategory()
  }

  async ngOnInit() {
    await this.refreshTeams();
    this.loading = false;
  }

  sortTeamsByCategory(){
    this.teams = this.teams.sort((a, b) => a.category!.localeCompare(b.category!))
  }

  sortTeamsByName(){
    this.teams = this.teams.sort((a, b) => a.name.localeCompare(b.name))
  }

  sortTeamsByLocation(){
    this.teams = this.teams.sort((a, b) => (a.location? a.location : "").localeCompare((b.location ? b.location : "")))
  }

  sortTeamsByCoach(){
    this.teams = this.teams.sort((a, b) => (a.coachName!.localeCompare(b.coachName!)));
  }

  async viewPlayers(teamId: string){
    console.log("View Players "+teamId);

    this.team = this.teams.filter((t)=> t.id === teamId)[0];
    this.players = await this.playerBuilder.getPlayersByTeam(this.ddb, teamId);
    this.displayPlayers = "block";
  }

  closePlayers(){
    this.players = [];
    this.displayPlayers = "none";
  }
}
  