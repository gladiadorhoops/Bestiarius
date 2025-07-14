import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from '../../auth.service';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { TeamBuilder } from '../../Builders/team-builder';
import { Team } from '../../interfaces/team';
import { UserBuilder } from '../../Builders/user-builder';
import { Player } from 'src/app/interfaces/player';
import { PlayerBuilder } from 'src/app/Builders/player-builder';
import { TOURNAMENT_YEAR } from 'src/app/aws-clients/constants';
import { S3 } from 'src/app/aws-clients/s3';

@Component({
  selector: 'app-list-players',
  templateUrl: './list-players.component.html',
  styleUrls: ['./list-players.component.scss']
})
export class ListPlayersComponent {
    player: Player | undefined;
    imageUrl: string | ArrayBuffer | null = "assets/no-avatar.png";
  
    constructor(
        private authService: AuthService,
        private teamBuilder: TeamBuilder,
        private userBuilder: UserBuilder,
        private playerBuilder: PlayerBuilder
      ){}
  
  
    @Input() ddb!: DynamoDb;

    loading = true;
    teams: Team[] = [];
    uTeams: Map<string,string> = new Map<string, string>();
  
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

    @Input() s3!: S3;
    async getS3ImgAsBuffer(playerId: string, imgType: string){
      let data = await this.s3.downloadFile(playerId)
      console.log("Downloaded data:", data);
  
      if (data) {
        let blob = new Blob([data], { type: imgType });
          // display blob as img
        const reader2 = new FileReader();
        reader2.readAsDataURL(blob);
        reader2.onload = () => {
          this.imageUrl = reader2.result;
        };
      } else {
        console.error("No data returned from downloadFile");
        this.imageUrl = "assets/no-avatar.png";
      }
    }

    displayPlayer = "none"
    closePlayerPopup(){
      this.player = undefined
      this.imageUrl = "assets/no-avatar.png"
      this.displayPlayer = "none"
    }
    async showPlayer(player: Player){
      console.log("Showing player: ", player.name)
      this.player = player
      if(player.imageType) await this.getS3ImgAsBuffer(player.id, player.imageType);
      this.displayPlayer = "block"
    }
  
  }
  