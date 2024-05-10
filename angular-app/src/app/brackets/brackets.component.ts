import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../interfaces/match';
import { FormBuilder } from '@angular/forms';
import { MatchBuilder } from '../Builders/match-builder';
import { DynamoDb } from '../aws-clients/dynamodb';
import { COGNITO_UNAUTHENTICATED_CREDENTIALS, REGION } from '../aws-clients/constants'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

@Component({
  selector: 'app-brackets',
  templateUrl: './brackets.component.html',
  styleUrls: ['./brackets.component.scss']
})
export class BracketsComponent implements OnInit {
  ddbClient = new DynamoDBClient({ 
    region: REGION,
    credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS
  }); 
  ddb: DynamoDb =  new DynamoDb(this.ddbClient);
  
  allMatches: Match[] = [];
  loading = true;

  isEditing: boolean = false;
  editingMatch: Match = {location: "", time: "", juego: "", visitorTeam: {id: "", name: "", category: ""}, visitorPoints: "0", homeTeam: {id: "", name: "", category: ""}, homePoints:"0"};
  phases = ["Octavos", "Cuartos", "Semi-Finaless", "Finales"]

  phaseMatches: {[place: string]: Match} = {}
  phaseMatchesElite: {[place: string]: Match} = {}

  constructor(private fb: FormBuilder, 
    private matchBuilder: MatchBuilder,
    private httpService: HttpClient
    ) {
  }

  async ngOnInit() {
    await this.loadMatches()
  }  

  async loadMatches(){

    this.allMatches = await this.matchBuilder.getListOfMatch(this.ddb)
    
    this.allMatches.forEach(element => {
      if(this.phases.includes(element.juego) && element.braketPlace != undefined){
        if(element.category == 'aprendiz'){
          this.phaseMatches[element.braketPlace] = element;
        }
        if(element.category == 'elite'){
          this.phaseMatchesElite[element.braketPlace] = element;
        }
      }
    });

    console.warn(this.phaseMatches)

    this.loading = false;
  }


}  
