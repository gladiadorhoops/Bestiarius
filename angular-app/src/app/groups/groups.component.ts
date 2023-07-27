import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../interfaces/match';
import { FormBuilder } from '@angular/forms';
import { MatchBuilder } from '../Builders/match-builder';
import { DynamoDb } from '../aws-clients/dynamodb';
import { COGNITO_UNAUTHENTICATED_CREDENTIALS, REGION } from '../aws-clients/constants'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

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
  editingMatch: Match = {location: "", time: "", juego: "", visitorTeam: {id: "", name: "", players: [], category: ""}, visitorPoints: "0", homeTeam: {id: "", name: "", players: [], category: ""}, homePoints:"0"};
  groups = ["Grupo 1", "Grupo 2", "Grupo 3", "Grupo 4"]

  groupMatches: {[group: string]: Match[]} = {}

  constructor(private fb: FormBuilder, 
    private matchBuilder: MatchBuilder,
    private httpService: HttpClient
    ) {
  }

  async ngOnInit() {
    await this.loadMatches()
  }  

  async loadMatches(){
    this.groups.forEach(element => {
      this.groupMatches[element] = [];
    });

    this.allMatches = await this.matchBuilder.getListOfMatch(this.ddb)
    this.allMatches.forEach(element => {
      if(this.groups.includes(element.juego)){
        this.groupMatches[element.juego].push(element);
      }
    });
    this.loading = false;

  }


}  
