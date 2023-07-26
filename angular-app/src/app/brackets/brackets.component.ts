import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../interfaces/match';
import { FormBuilder } from '@angular/forms';
import { MatchBuilder } from '../Builders/match-builder';
import { DynamoDb } from '../aws-clients/dynamodb';

@Component({
  selector: 'app-brackets',
  templateUrl: './brackets.component.html',
  styleUrls: ['./brackets.component.scss']
})
export class BracketsComponent implements OnInit {
  @Input() ddb!: DynamoDb;
  
  allMatches: Match[] = [];

  isEditing: boolean = false;
  editingMatch: Match = {location: "", time: "", juego: "", visitorTeam: {id: "", name: "", players: [], category: ""}, visitorPoints: "0", homeTeam: {id: "", name: "", players: [], category: ""}, homePoints:"0"};
  phases = ["Quarter-Finals", "Semi-Finals", "Finals"]

  phaseMatches: {[group: string]: Match[]} = {}

  constructor(private fb: FormBuilder, 
    private matchBuilder: MatchBuilder,
    private httpService: HttpClient
    ) {
  }

  async ngOnInit() {
    await this.loadMatches()
  }  

  async loadMatches(){
    this.phases.forEach(element => {
      this.phaseMatches[element] = [];
    });

    this.allMatches = await this.matchBuilder.getListOfMatch(this.ddb)
    this.allMatches.forEach(element => {
      if(this.phases.includes(element.juego)){
        this.phaseMatches[element.juego].push(element);
      }
    })
  }


}  
