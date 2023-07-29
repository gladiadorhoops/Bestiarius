import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../interfaces/match';
import { FormBuilder } from '@angular/forms';
import { MatchBuilder } from '../Builders/match-builder';
import { TeamBuilder } from '../Builders/team-builder';
import { DynamoDb } from '../aws-clients/dynamodb';
import { Team } from '../interfaces/team';

@Component({
  selector: 'app-match-editor',
  templateUrl: './match-editor.component.html',
  styleUrls: ['./match-editor.component.scss']
})
export class MatchEditorComponent implements OnInit {
  @Input() ddb!: DynamoDb;
  
  days: number[] = [28, 29, 30];
  allMatches: Match[] = [];
  matchesAprendizDays: Match[][] = [];
  matchesEliteDays: Match[][] = [];
  todayDay = new Date().getDate();
  gyms = ['Gimnasio Nuevo', 'Gimnasio Tecnológico', 'Cancha Sindicato', 'Gimnasio Municipal', 'Gimnasio Municipal (afuera)', 'Gimnasio Federal'];


  equipos : Team[] = [];
  filteredequipos: Team[] = [];

  filteredMatches: Match[] = [];

  isEditing: boolean = false;
  loading: boolean = true;
  editingMatch: Match = {location: "", time: "", juego: "", visitorTeam: {id: "", name: "", players: [], category: ""}, visitorPoints: "0", homeTeam: {id: "", name: "", players: [], category: ""}, homePoints:"0"};
  

  constructor(private fb: FormBuilder, 
    private matchBuilder: MatchBuilder,
    private teamBuilder: TeamBuilder,
    private httpService: HttpClient
    ) {
  }

  filterForm = this.fb.group({
    cat: null,
    day: null,
    gym: null,
    equipo: null
  });

  marcadorForm = this.fb.group({
    homeTeam : [""],
    visitorTeam : [""]
  });

  async ngOnInit() {
    await this.loadMatches()
  }  

  async loadMatches(){
    this.allMatches = await this.matchBuilder.getListOfMatch(this.ddb)
    this.equipos = await this.teamBuilder.getListOfTeams(this.ddb)
    this.filteredMatches = this.allMatches;
    this.loading = false;
  }

  applyFilters() {
    this.filteredMatches = this.allMatches;

    let cat = "";
    if(this.filterForm.value.cat != null){
      console.log(this.filterForm.value.cat)
      cat = this.filterForm.value.cat;
      console.log(cat)
    }

    if(cat != ""){
      let matches : Match[] = []
      this.filteredMatches.forEach(
        async (match) => {
          if(match.category == cat){
            matches.push(match);
          }
        }
      );
      this.filteredMatches = matches;
    }

    let day = "";
    if(this.filterForm.value.day != null){
      day = this.filterForm.value.day;
    }

    if(day != ""){
      let matches : Match[] = []
      this.filteredMatches.forEach(
        async (match) => {
          if(match.day == day){
            matches.push(match);
          }
        }
      );
      this.filteredMatches = matches;
    }

    let gym = "";
    if(this.filterForm.value.gym != null){
      gym = this.filterForm.value.gym;
    }

    if(gym != ""){
      let matches : Match[] = []
      this.filteredMatches.forEach(
        async (match) => {
          if(match.location == gym){
            matches.push(match);
          }
        }
      );
      this.filteredMatches = matches;
    }

    let equipo = "";
    if(this.filterForm.value.equipo != null){
      equipo = this.filterForm.value.equipo;
    }
    
    if(equipo != ""){
      let matches : Match[] = []
      this.filteredMatches.forEach(
        async (match) => {
          if(match.homeTeam.name == equipo || match.visitorTeam.name == equipo){
            matches.push(match);
          }
        }
      );
      
      this.filteredMatches = matches;
    }

    console.log(day);
    console.log(gym);
    console.log(equipo);
  }
  onSubmit(){
    let id = "";
    if(this.editingMatch.id){
      id = this.editingMatch.id;
    }
    let hs = "";
    if(this.marcadorForm.value.homeTeam){
      hs = this.marcadorForm.value.homeTeam.toString();
    }
    let vs = "";
    if(this.marcadorForm.value.visitorTeam){
      vs = this.marcadorForm.value.visitorTeam.toString();
    }
    this.matchBuilder.EditTeams(this.ddb, id, hs, vs).then(
      (rs) => {
        this.loadMatches();
      }
    );
    console.warn("New score: "+hs+"x"+vs);
    
    this.goBack();
  }

  edit(match:Match){
    this.isEditing = true;
    this.editingMatch = match;
    this.filteredequipos = this.equipos.filter(e => e.category == match.category);
    if(match.homeTeam){
      this.marcadorForm.controls.homeTeam.setValue((match.homeTeam.id!));
    }
    if(match.visitorTeam){
      this.marcadorForm.controls.visitorTeam.setValue((match.visitorTeam.id!));
    }
    console.warn("Editing: "+this.editingMatch.id!);
  }

  goBack(){
    this.isEditing = false;
    this.marcadorForm.reset();
  }

}  
