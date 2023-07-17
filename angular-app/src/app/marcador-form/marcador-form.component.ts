import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../interfaces/match';
import { FormBuilder } from '@angular/forms';
import { match } from 'assert';

const S3_BUCKET_URL = (day: string) => `https://gladiadores-hoops.s3.amazonaws.com/match-data/tournament-11/category-matches-2023-07-${day}.json`

@Component({
  selector: 'app-marcador-form',
  templateUrl: './marcador-form.component.html',
  styleUrls: ['./marcador-form.component.scss']
})
export class MarcadorFormComponent implements OnInit {

  days: number[] = [28, 29, 30];
  matchesAprendizDays: Match[][] = [];
  matchesEliteDays: Match[][] = [];
  todayDay = new Date().getDate();
  gyms = ['Gimnasio Nuevo', 'Gimnasio Tecnológico', 'Cancha Sindicato', 'Gimnasio Municipal'];


  equiposAp : string[] = [ "Raptors", "RoQui", "Bulldogs", "ABA", "Lions", "Abejas", "Rawigas", "Gansos", "Borreguitos", "Falcons", "Tigres", "ESBAL"];
  equiposEl : string[] = [ "Leñadores", "Selec. Chih.", "Mambas", "ESCOBA", "RoQui", "Mini Regios", "SAHQ", "Carrilleros", "Rawigas", "Black Devils", "Mineros", "24 Cent"];
  equipos : string[] = [];

  filteredMatches: Match[] = [];

  isEditing: boolean = false;
  editingMatch: Match = {location: "", time: "", juego: "", visitorTeam: {id: "", name: "", points: 0, players: [], category: ""}, homeTeam: {id: "", name: "", points: 0, players: [], category: ""}};
  

  constructor(private fb: FormBuilder, private httpService: HttpClient) {
  }

  filterForm = this.fb.group({
    cat: ["Elite"],
    day: ["28"],
    gym: [""],
    equipo: [""]
  });

  marcadorForm = this.fb.group({
    homeScore : [0],
    visitorScore : [0]
  });

  async ngOnInit() {
    this.loadS3Files('28');
    this.loadS3Files('29');
    this.loadS3Files('30');
  }  

  async loadS3Files(day : string){
    this.httpService.get(S3_BUCKET_URL(day)).subscribe(
      (response) => {
        this.matchesAprendizDays[Number(day)] = (response as any).matchesAprendiz as Match[];
        this.matchesEliteDays[Number(day)] = (response as any).matchesElite as Match[];

        this.loadDayMatches();
      },  
      (error) => {
        console.error(error)
      }  
    ) 
  }

  loadDayMatches(){
    let day = "28";
    let cat = "Elite";
    
    if(this.filterForm.value.day != null){
      day = this.filterForm.value.day;
    }
    if(this.filterForm.value.cat != null){
      cat = this.filterForm.value.cat;
    }

    if(cat == "Elite"){
      this.filteredMatches = this.matchesEliteDays[Number(day)];
      this.equipos = this.equiposEl;
    }
    else {
      this.filteredMatches = this.matchesAprendizDays[Number(day)];
      this.equipos = this.equiposAp;
    }

  }

  applyFilters() {
    this.loadDayMatches();

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
    console.warn("New score: "+this.marcadorForm.value.homeScore+"x"+this.marcadorForm.value.visitorScore);
    this.goBack();
  }

  edit(match:Match){
    this.isEditing = true;
    this.editingMatch = match;
    console.warn("Editing: "+this.editingMatch.homeTeam.name+"x"+this.editingMatch.visitorTeam.name);
  }
  goBack(){
    this.isEditing = false;
    this.marcadorForm.reset();
  }

  
  
  

}  
