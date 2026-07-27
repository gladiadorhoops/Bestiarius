import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AuthService } from '../auth.service';
import { DynamoDb } from '../aws-clients/dynamodb';
import { TeamBuilder } from '../Builders/team-builder';
import { Team } from '../interfaces/team';
import { PlayerBuilder } from '../Builders/player-builder';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { COGNITO_UNAUTHENTICATED_CREDENTIALS, REGION } from '../aws-clients/constants';
import { S3 } from '../aws-clients/s3';
import { Player } from '../interfaces/player';
import { FeatureFlag } from '../interfaces/feature-flag';
import { FeatureFlagBuilder } from '../Builders/feature-flag-builder';

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
    private playerBuilder: PlayerBuilder,
    private featureFlagBuilder: FeatureFlagBuilder
  ){}
  
  
  ddb: DynamoDb =  new DynamoDb(this.ddbClient);
  s3: S3 = new S3(new S3Client({ region: REGION, credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS }));
  loading = true;
  available = false;
  teams: Team[] = [];
  team: Team | undefined;
  players: Player[] = [];
  displayPlayers = "none;"

  // Team logos loaded from S3, keyed by team id, so the list can show a small
  // logo before each team name (same as the registered-teams table).
  teamLogos: Map<string, string | ArrayBuffer | null | undefined> = new Map();

  featureFlags: FeatureFlag | undefined = undefined


  async refreshTeams(){

    this.teams = await this.teamBuilder.getTeams(this.ddb);
    this.sortTeamsByCategory()
    this.loadTeamLogos();
  }

  // Fetch each team's logo from S3 into the teamLogos map. Falls back to the
  // gray placeholder while loading or when a team has no logo.
  loadTeamLogos(){
    this.teams.forEach(team => {
      if (!this.teamLogos.has(team.id)) {
        this.teamLogos.set(team.id, "assets/logo_gray.png");
      }
      if (team.imageType) {
        this.s3.downloadFile(TeamBuilder.getLogoFilePath(team.id)).then(data => {
          if (data) {
            const blob = new Blob([data as BlobPart], { type: team.imageType });
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => this.teamLogos.set(team.id, reader.result);
          }
        });
      }
    });
  }

  teamLogo(teamId: string): string | ArrayBuffer | null | undefined {
    return this.teamLogos.get(teamId) ?? "assets/logo_gray.png";
  }

  async ngOnInit() {
    this.featureFlags = await this.featureFlagBuilder.getFeatureFlags(this.ddb);
    this.available = this.featureFlags ? this.featureFlags.showParticipants : false;

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
  