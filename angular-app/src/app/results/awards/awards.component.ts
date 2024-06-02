import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Award } from 'src/app/interfaces/award';
import { AwardBuilder } from '../../Builders/award-builder';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { COGNITO_UNAUTHENTICATED_CREDENTIALS, CURRENT_YEAR, REGION } from '../../aws-clients/constants'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

@Component({
  selector: 'app-awards',
  templateUrl: './awards.component.html',
  styleUrls: ['./awards.component.scss']
})
export class AwardsComponent implements OnInit {
  ddbClient = new DynamoDBClient({ 
    region: REGION,
    credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS
  }); 
  ddb: DynamoDb =  new DynamoDb(this.ddbClient);

  constructor(private httpService: HttpClient, private awardBuilder: AwardBuilder) { }
  
  teamWinners : Award[] = []
  individualWinners : Award[] = []
  selectedYear:string = "";
  loading = true;

  async ngOnInit() {
    await this.loadWinners(CURRENT_YEAR)
  }  

  async loadWinners(year: string){
    this.loading = true;

    this.selectedYear = year;

    this.teamWinners = [];
    this.individualWinners = [];

    let awardWinners = await this.awardBuilder.getListOfAwards(this.ddb, year);
    this.teamWinners = awardWinners.filter((a)=>a.type==='equipo');
    this.individualWinners = awardWinners.filter((a)=>a.type==='individual');
    
    if(awardWinners.length > 0){
      this.loading = false;
    }

  }

}
