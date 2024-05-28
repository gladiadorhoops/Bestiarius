import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../../interfaces/match';
import { FormBuilder } from '@angular/forms';
import { MatchBuilder } from '../../Builders/match-builder';
import { TeamBuilder } from '../../Builders/team-builder';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { Team } from '../../interfaces/team';
import { CURRENT_YEAR } from 'src/app/aws-clients/constants';

const S3_BUCKET_URL = (day: string) => `https://gladiadores-hoops.s3.amazonaws.com/match-data/tournament-11/category-matches-2023-07-${day}.json`

@Component({
  selector: 'app-marcador-form',
  templateUrl: './marcador-form.component.html',
  styleUrls: ['./marcador-form.component.scss']
})
export class MarcadorFormComponent implements OnInit {
  @Input() ddb!: DynamoDb;
  
  days: number[] = [26, 27, 28];
  allMatches: Match[] = [];
  matchesAprendizDays: Match[][] = [];
  matchesEliteDays: Match[][] = [];
  todayDay = new Date().getDate();
  gyms = ['Gimnasio Nuevo', 'Gimnasio Tecnológico', 'Cancha Sindicato', 'Gimnasio Municipal', 'Gimnasio Municipal (afuera)', 'Gimnasio Federal'];


  equiposAp : string[] = [ "Raptors", "RoQui", "Bulldogs", "ABA", "Lions", "Abejas", "Rawigas", "Gansos", "Borreguitos", "Falcons", "Tigres", "ESBAL"];
  equiposEl : string[] = [ "Leñadores", "Selec. Chih.", "Mambas", "ESCOBA", "RoQui", "Mini Regios", "SAHQ", "Carrilleros", "Rawigas", "Black Devils", "Mineros", "24 Cent"];
  equipos : Team[] = [];

  filteredMatches: Match[] = [];

  isEditing: boolean = false;
  loading: boolean = true;
  editingMatch: Match = {location: "", time: "", juego: "", visitorTeam: {id: "", name: "", category: ""}, visitorPoints: "0", homeTeam: {id: "", name: "", category: ""}, homePoints:"0"};
  

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
    homeScore : [0],
    visitorScore : [0]
  });

  async ngOnInit() {
    await this.loadMatches()
  }  

  async loadMatches(){
    this.allMatches = await this.matchBuilder.getListOfMatch(this.ddb, CURRENT_YEAR)
    this.equipos = await this.teamBuilder.getTeamsByCategory(this.ddb)
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
    if(this.marcadorForm.value.homeScore){
      hs = this.marcadorForm.value.homeScore.toString();
    }
    let vs = "";
    if(this.marcadorForm.value.visitorScore){
      vs = this.marcadorForm.value.visitorScore.toString();
    }
    this.matchBuilder.submit(this.ddb, id, hs, vs).then(
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
    if(match.homePoints){
      this.marcadorForm.controls.homeScore.setValue(Number(match.homePoints));
    }
    if(match.visitorPoints){
      this.marcadorForm.controls.visitorScore.setValue(Number(match.visitorPoints));
    }
    console.warn("Editing: "+this.editingMatch.homeTeam.name+"x"+this.editingMatch.visitorTeam.name);
  }

  goBack(){
    this.isEditing = false;
    this.marcadorForm.reset();
  }

}  
