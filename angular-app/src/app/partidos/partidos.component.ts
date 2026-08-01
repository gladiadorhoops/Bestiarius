import { Component, QueryList, ViewChildren } from '@angular/core';
import { BracketsComponent } from '../results/brackets/brackets.component';
import { StandingMatchesComponent } from '../results/standing-matches/standing-matches.component';
import { GroupsComponent } from '../results/groups/groups.component';
import { AwardsComponent } from '../results/awards/awards.component';
import { COGNITO_UNAUTHENTICATED_CREDENTIALS, TOURNAMENT_YEAR, REGION } from '../aws-clients/constants';
import { FeatureFlag } from '../interfaces/feature-flag';
import { FeatureFlagBuilder } from '../Builders/feature-flag-builder';
import { TeamBuilder } from '../Builders/team-builder';
import { DynamoDb } from '../aws-clients/dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3 } from '../aws-clients/s3';
import { S3Client } from '@aws-sdk/client-s3';

@Component({
  selector: 'app-partidos',
  templateUrl: './partidos.component.html',
  styleUrls: ['./partidos.component.scss']
})
export class PartidosComponent {

  constructor(
    private featureFlagBuilder: FeatureFlagBuilder,
    private teamBuilder: TeamBuilder
  ){
  }

  loading = false;
  TournmentEdition = Number(TOURNAMENT_YEAR)-2012;
  ddbClient = new DynamoDBClient({ 
    region: REGION,
    credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS
  }); 
  ddb: DynamoDb =  new DynamoDb(this.ddbClient);
  s3: S3 = new S3(new S3Client({ region: REGION, credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS }));

  featureFlags: FeatureFlag | undefined = undefined
  teamLogos: {[teamId: string]: string} = {};
  
  showBrackets = false;
  showStandings = false;
  showGroups = false;
  showAwards = false;

  // Shared category filter for brackets, standings and groups. Only one
  // category is shown at a time; defaults to elite.
  categories = ["elite", "aprendiz"] as const;
  selectedCategory: 'elite' | 'aprendiz' = 'elite';

  @ViewChildren(BracketsComponent) bracketChild!: QueryList<BracketsComponent>;
  @ViewChildren(StandingMatchesComponent) standingsChild!: QueryList<StandingMatchesComponent>;
  @ViewChildren(GroupsComponent) groupsChild!: QueryList<GroupsComponent>;
  @ViewChildren(AwardsComponent) awardsChild!: QueryList<AwardsComponent>;


  async ngOnInit() {
    this.featureFlags = await this.featureFlagBuilder.getFeatureFlags(this.ddb);
    console.log("init partidos");
    await this.loadResults();
  } 
  
  async loadResults(){
    this.loading = false;
    this.teamLogos = {};
    void this.loadSharedTeamLogos();
    await this.showViews();
  }

  private async loadSharedTeamLogos() {
    const loadedLogos = await this.teamBuilder.loadAllTeamLogos(this.ddb, this.s3, TOURNAMENT_YEAR);
    this.teamLogos = loadedLogos;
  }

  selectCategory(category: 'elite' | 'aprendiz'){
    this.selectedCategory = category;
  }

  async showViews(){
    this.showAwards = this.featureFlags ? this.featureFlags.showAwards : false;
    this.showBrackets = this.featureFlags ? this.featureFlags.showBrackets : false;
    this.showGroups = this.featureFlags ? this.featureFlags.showGroups : false;
    this.showStandings = this.featureFlags ? this.featureFlags.showStandings : false;

    if(this.showAwards){
      await this.awardsChild;
      await this.awardsChild.forEach(element => {
        element.loadWinners(TOURNAMENT_YEAR);
        return;
      });
    }

    if(this.showGroups){
      await this.groupsChild;
      await this.groupsChild.forEach(element => {
        element.loadMatches(TOURNAMENT_YEAR);
        return;
      });
    }

    if(this.showBrackets){
      await this.bracketChild;
      await this.bracketChild.forEach(element => {
        element.loadMatches(TOURNAMENT_YEAR);
      });
    }

    if(this.showStandings){
      await this.standingsChild;
      await this.standingsChild.forEach(element => {
        element.loadMatches(TOURNAMENT_YEAR);
        return;
      });
    }
  }
}
