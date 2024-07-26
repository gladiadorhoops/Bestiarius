import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../../interfaces/match';
import { FormBuilder } from '@angular/forms';
import { MatchBuilder } from '../../Builders/match-builder';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { COGNITO_UNAUTHENTICATED_CREDENTIALS, TOURNAMENT_YEAR, REGION } from '../../aws-clients/constants'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

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
  
  allMatches: Match[] = [];
  loading = true;


  standingMatches: Match[] = []
  standingMatchesElite: Match[] = []

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

  }
}  
