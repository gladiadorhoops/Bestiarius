import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../../interfaces/match';
import { FormBuilder } from '@angular/forms';
import { MatchBuilder } from '../../Builders/match-builder';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { COGNITO_UNAUTHENTICATED_CREDENTIALS, TOURNAMENT_YEAR, REGION } from '../../aws-clients/constants'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { MatchTeam } from 'src/app/interfaces/team';
import { TeamBuilder } from 'src/app/Builders/team-builder';
import { S3 } from '../../aws-clients/s3';
import { S3Client } from '@aws-sdk/client-s3';

const LOGO_PLACEHOLDER = 'assets/logo_gray.png';

@Component({
  selector: 'app-standing-matches',
  templateUrl: './standing-matches.component.html',
  styleUrls: ['./standing-matches.component.scss']
})
export class StandingMatchesComponent implements OnInit {
  ddbClient = new DynamoDBClient({ 
    region: REGION,
    credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS
  }); 
  ddb: DynamoDb =  new DynamoDb(this.ddbClient);
  s3: S3 = new S3(new S3Client({ region: REGION, credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS }));

  allMatches: Match[] = [];
  loading = true;


  standingMatches: Match[] = []
  standingMatchesElite: Match[] = []
  teamLogos: {[teamId: string]: string} = {};

  // Category to show, controlled by the shared toggle in the parent results page.
  @Input() category: 'elite' | 'aprendiz' = 'elite';

  constructor(private fb: FormBuilder, 
    private matchBuilder: MatchBuilder,
    private httpService: HttpClient
    ) {
  }

  selectedYear:string = "";

  async ngOnInit() {
    await this.loadMatches(TOURNAMENT_YEAR)
  }  

  async loadMatches(year: string){
    this.selectedYear = year;

    this.standingMatches = []
    this.standingMatchesElite = []

    this.allMatches = await this.matchBuilder.getListOfMatch(this.ddb, year)
    this.allMatches = this.allMatches.sort((a, b) => (a.day! + a.time!).localeCompare(b.day! + b.time!))
    this.allMatches.forEach(element => {
      if(element.juego == 'Standing'){
        if(element.category == "elite"){
          this.standingMatchesElite.push(element);
        }
        else{
          this.standingMatches.push(element);
        }
      }
    });
    this.loading = false;
    await this.loadTeamLogos();

  }


  // Downloads each participating team's logo once and stores a displayable
  // object URL. Mirrors the download-then-blob approach used in view-teams so
  // it works with the public (unauthenticated) Cognito credentials.
  private async loadTeamLogos() {
    const teams = new Map<string, MatchTeam>();
    const matches = [...Object.values(this.standingMatches), ...Object.values(this.standingMatchesElite)];
    for (const match of matches) {
      for (const team of [match.homeTeam, match.visitorTeam]) {
        if (team?.id && team.imageType && !teams.has(team.id)) {
          teams.set(team.id, team);
        }
      }
    }

    for (const [id, team] of teams) {
      const data = await this.s3.downloadFile(TeamBuilder.getLogoFilePath(id));
      if (data) {
        this.teamLogos[id] = URL.createObjectURL(new Blob([data as BlobPart], { type: team.imageType }));
      }
    }
  }

  teamLogoUrl(team: MatchTeam | undefined): string {
    return (team?.id && this.teamLogos[team.id]) || LOGO_PLACEHOLDER;
  }

  onLogoError(event: Event) {
    (event.target as HTMLImageElement).src = LOGO_PLACEHOLDER;
  }

}  
