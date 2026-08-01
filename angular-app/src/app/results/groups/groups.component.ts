import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../../interfaces/match';
import { FormBuilder } from '@angular/forms';
import { MatchBuilder } from '../../Builders/match-builder';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { COGNITO_UNAUTHENTICATED_CREDENTIALS, TOURNAMENT_YEAR, REGION } from '../../aws-clients/constants'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { MatchTeam } from 'src/app/interfaces/team';



const LOGO_PLACEHOLDER = 'assets/logo_gray.png';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnInit {
  ddbClient = new DynamoDBClient({ 
    region: REGION,
    credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS
  }); 
  ddb: DynamoDb =  new DynamoDb(this.ddbClient);

  allMatches: Match[] = [];
  loading = true;

  isEditing: boolean = false;
  groups = ["Grupo 1", "Grupo 2", "Grupo 3", "Grupo 4", "Grupo A", "Grupo B", "Grupo C"]

  groupMatches: {[group: string]: Match[]} = {}
  groupMatchesElite: {[group: string]: Match[]} = {}

  // Category to show, controlled by the shared toggle in the parent results page.
  @Input() category: 'elite' | 'aprendiz' = 'elite';
  @Input() teamLogos: {[teamId: string]: string} = {};

  constructor(private fb: FormBuilder, 
    private matchBuilder: MatchBuilder,
    private httpService: HttpClient
    ) {
  }
  selectedYear = "";

  async ngOnInit() {
    await this.loadMatches(TOURNAMENT_YEAR)
  }  

  async loadMatches(year: string){

    this.selectedYear = year;

    this.groupMatches = {}
    this.groupMatchesElite = {}

    this.groups.forEach(element => {
      this.groupMatches[element] = [];
      this.groupMatchesElite[element] = [];
    });

    this.allMatches = await this.matchBuilder.getListOfMatch(this.ddb, this.selectedYear)
    this.allMatches = this.allMatches.sort((a, b) => (a.datetime!.toISOString().localeCompare(b.datetime!.toISOString())))
    
    this.allMatches.forEach(element => {
      if(this.groups.includes(element.juego)){
        if(element.category == "elite"){
          this.groupMatchesElite[element.juego].push(element);
        }
        else{
          this.groupMatches[element.juego].push(element);
        }
      }
    });
    this.loading = false;
  }

  teamLogoUrl(team: MatchTeam | undefined): string {
    return (team?.id && this.teamLogos[team.id]) || LOGO_PLACEHOLDER;
  }

  onLogoError(event: Event) {
    (event.target as HTMLImageElement).src = LOGO_PLACEHOLDER;
  }


}  
