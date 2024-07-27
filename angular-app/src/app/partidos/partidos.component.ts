import { Component, QueryList, ViewChildren } from '@angular/core';
import { BracketsComponent } from '../results/brackets/brackets.component';
import { StandingMatchesComponent } from '../results/standing-matches/standing-matches.component';
import { GroupsComponent } from '../results/groups/groups.component';
import { AwardsComponent } from '../results/awards/awards.component';
import { COGNITO_UNAUTHENTICATED_CREDENTIALS, TOURNAMENT_YEAR, REGION } from '../aws-clients/constants';
import { FeatureFlag } from '../interfaces/feature-flag';
import { FeatureFlagBuilder } from '../Builders/feature-flag-builder';
import { DynamoDb } from '../aws-clients/dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

@Component({
  selector: 'app-partidos',
  templateUrl: './partidos.component.html',
  styleUrls: ['./partidos.component.scss']
})
export class PartidosComponent {

  constructor(
    private featureFlagBuilder: FeatureFlagBuilder
  ){
  }

  loading = false;
  TournmentEdition = Number(TOURNAMENT_YEAR)-2012;
  ddbClient = new DynamoDBClient({ 
    region: REGION,
    credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS
  }); 
  ddb: DynamoDb =  new DynamoDb(this.ddbClient);


  featureFlags: FeatureFlag | undefined = undefined
  
  showBrackets = false;
  showStandings = false;
  showGroups = false;
  showAwards = false;

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
    await this.showViews();
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
