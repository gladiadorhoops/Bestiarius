import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../../auth.service';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { TeamBuilder } from '../../Builders/team-builder';
import { Team } from '../../interfaces/team';
import { UserBuilder } from '../../Builders/user-builder';
import { Player } from 'src/app/interfaces/player';
import { PlayerBuilder } from 'src/app/Builders/player-builder';
import { TOURNAMENT_YEAR } from 'src/app/aws-clients/constants';

@Component({
  selector: 'app-list-players',
  templateUrl: './list-players.component.html',
  styleUrls: ['./list-players.component.scss']
})
export class ListPlayersComponent {
  
    constructor(
        private authService: AuthService,
        private teamBuilder: TeamBuilder,
        private userBuilder: UserBuilder,
        private playerBuilder: PlayerBuilder
      ){}
  
  
    @Input() ddb!: DynamoDb;
    loading = true;
    teams: Team[] = [];
    uTeams: Map<string,string> = new Map<string, string>;
  
    isAdmin = false;
    isScout = false;
    isCoach = false;
    userId = "";
    userrole = "";

    players: Player[] = [];
    
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

    async refreshTeams(){
      this.reloadLoginStatus()
      
      this.teams = await this.teamBuilder.getTeams(this.ddb, TOURNAMENT_YEAR);
      
      this.teams.forEach(team => {
        this.uTeams.set(team.id, team.name);
      });
    }
    
    async ngOnInit() {
      await this.refreshTeams();
      
      this.players = await this.playerBuilder.getAllPlayers(this.ddb);
      this.sortPlayersByEquipo()

      this.loading = false;
    }
  
    sortPlayersByCategory(){
      this.players = this.players.sort((a, b) => a.category!.localeCompare(b.category!))
    }
  
    sortPlayersByEquipo(){
      this.players = this.players.sort((a, b) => this.uTeams.get(a.team)!.localeCompare(this.uTeams.get(b.team)!))
    }
  
    sortPlayersByName(){
      this.players = this.players.sort((a, b) => (a.name).localeCompare((b.name)))
    }
  
  }
  