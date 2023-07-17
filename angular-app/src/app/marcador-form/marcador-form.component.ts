import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../interfaces/match';
import { FormBuilder } from '@angular/forms';
import { MatchBuilder } from '../Builders/match-builder';
import { DynamoDb } from '../aws-clients/dynamodb';

const S3_BUCKET_URL = (day: string) => `https://gladiadores-hoops.s3.amazonaws.com/match-data/tournament-11/category-matches-2023-07-${day}.json`

@Component({
  selector: 'app-marcador-form',
  templateUrl: './marcador-form.component.html',
  styleUrls: ['./marcador-form.component.scss']
})
export class MarcadorFormComponent implements OnInit {
  @Input() ddb!: DynamoDb;
  
  days: number[] = [28, 29, 30];
  allMatches: Match[] = [];
  matchesAprendizDays: Match[][] = [];
  matchesEliteDays: Match[][] = [];
  todayDay = new Date().getDate();
  gyms = ['Gimnasio Nuevo', 'Gimnasio Tecnológico', 'Cancha Sindicato', 'Gimnasio Municipal'];


  equiposAp : string[] = [ "Raptors", "RoQui", "Bulldogs", "ABA", "Lions", "Abejas", "Rawigas", "Gansos", "Borreguitos", "Falcons", "Tigres", "ESBAL"];
  equiposEl : string[] = [ "Leñadores", "Selec. Chih.", "Mambas", "ESCOBA", "RoQui", "Mini Regios", "SAHQ", "Carrilleros", "Rawigas", "Black Devils", "Mineros", "24 Cent"];
  equipos : string[] = [];

  filteredMatches: Match[] = [];

  isEditing: boolean = false;
  editingMatch: Match = {location: "", time: "", juego: "", visitorTeam: {id: "", name: "", players: [], category: ""}, visitorPoints: "0", homeTeam: {id: "", name: "", players: [], category: ""}, homePoints:"0"};
  

  constructor(private fb: FormBuilder, 
    private matchBuilder: MatchBuilder,
    private httpService: HttpClient
    ) {
  }

  filterForm = this.fb.group({
    cat: ["elite"],
    day: ["29"],
    gym: [""],
    equipo: [""]
  });

  marcadorForm = this.fb.group({
    homeScore : [0],
    visitorScore : [0]
  });

  async ngOnInit() {
    await this.loadMatches()
  }  

  async loadMatches(){
    this.allMatches = await this.matchBuilder.getListOfMatch(this.ddb).then(
      (output) => {
        this.filteredMatches = output;
        return output;
      }
    )
  }

  applyFilters() {
    this.filteredMatches = this.allMatches;

    let cat = "";
    if(this.filterForm.value.cat != null){
      cat = this.filterForm.value.cat;
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
          if(match.homeTeam.name == equipo){
            matches.push(match);
          }
          if(match.visitorTeam.name == equipo){
            matches.push(match);
          }
        }
      );
      
      this.filteredMatches = matches;
    }
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
