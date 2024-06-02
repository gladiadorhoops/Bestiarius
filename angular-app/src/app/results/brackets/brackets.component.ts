import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../../interfaces/match';
import { FormBuilder } from '@angular/forms';
import { MatchBuilder } from '../../Builders/match-builder';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { COGNITO_UNAUTHENTICATED_CREDENTIALS, CURRENT_YEAR, REGION } from '../../aws-clients/constants'
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
  showAprendiz: boolean = false;
  showElite: boolean = false;

  constructor(private fb: FormBuilder, 
    private matchBuilder: MatchBuilder,
    private httpService: HttpClient
    ) {
  }

  selectedYear:string = "";

  async ngOnInit() {
    console.log("init brackets");
    await this.loadMatches(CURRENT_YEAR);
  }  

  async loadMatches(year: string){

    this.selectedYear = year;

    this.phaseMatches = {}
    this.phaseMatchesElite = {}

    this.allMatches = await this.matchBuilder.getListOfMatch(this.ddb, year)
    console.log("matches: ", this.allMatches)
    
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


    this.showAprendiz = Object.keys(this.phaseMatches).length != 0;
    this.showElite = Object.keys(this.phaseMatchesElite).length != 0;

    this.loading = false;

    console.log("loaded bracket")

  }

}  
