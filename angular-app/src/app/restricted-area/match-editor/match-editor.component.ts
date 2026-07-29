import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../../interfaces/match';
import { Gym } from '../../interfaces/gym';
import { FormBuilder } from '@angular/forms';
import { MatchBuilder } from '../../Builders/match-builder';
import { GymBuilder } from '../../Builders/gym-builder';
import { TeamBuilder } from '../../Builders/team-builder';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { Team } from '../../interfaces/team';
import { TOURNAMENT_DAYS, TOURNAMENT_YEAR } from 'src/app/aws-clients/constants';
import { filterMatches } from 'src/app/utils/utils';

@Component({
  selector: 'app-match-editor',
  templateUrl: './match-editor.component.html',
  styleUrls: ['./match-editor.component.scss']
})
export class MatchEditorComponent implements OnInit {
  @Input() ddb!: DynamoDb;

  
  days: number[] = TOURNAMENT_DAYS;
  allMatches: Match[] = [];
  matchesAprendizDays: Match[][] = [];
  matchesEliteDays: Match[][] = [];
  todayDay = new Date().getDate();
  gyms : Gym[] = [];//['Gimnasio Nuevo', 'Gimnasio Tecnológico', 'Cancha Sindicato', 'Gimnasio Municipal', 'Gimnasio Municipal (afuera)', 'Gimnasio Federal'];


  teams : Team[] = [];
  filteredTeams: Team[] = [];

  filteredMatches: Match[] = [];

  isEditing: boolean = false;
  loading: boolean = true;
  displayConfirmDeleteMatch = "none";
  errorMsg = "";
  selectedMatch: Match;
  editingMatch: Match = {location: {id: "", name: ""}, time: "", datetime: new Date(), juego: "", visitorTeam: {id: "", name: "", category: ""}, visitorPoints: "0", homeTeam: {id: "", name: "", category: ""}, homePoints:"0"};
  

  constructor(private fb: FormBuilder, 
    private matchBuilder: MatchBuilder,
    private gymBuilder: GymBuilder,
    private teamBuilder: TeamBuilder,
    private httpService: HttpClient
    ) {
      this.selectedMatch=this.matchBuilder.getEmptyMatch();
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
    this.gyms = await this.gymBuilder.getListOfGyms(this.ddb, TOURNAMENT_YEAR);
    this.allMatches = await this.matchBuilder.getListOfMatch(this.ddb, TOURNAMENT_YEAR)
    this.teams = await this.teamBuilder.getTeams(this.ddb)
    this.filteredMatches = this.allMatches;
    this.filteredTeams = this.teams;
    this.applyCategoryFilter();
    this.filterTeamsNewMatch()
    this.loading = false;
  }

  applyCategoryFilter() {
    this.filteredMatches = this.allMatches;
    this.filteredTeams = this.teams;

    let cat = this.filterForm.value.cat
    console.log(`Applying filter`, cat);

    if(cat){
      this.filteredMatches = this.filteredMatches.filter(match => match.category == cat);
      this.filteredTeams = this.filteredTeams.filter(team => team.category == cat);      
    }
    // if category is changed we should clear existing filter on teams becasue teams
    // only exist for a specific category
    this.filterForm.get('equipo')?.reset()
    this.applyFilters(this.filteredMatches);
  }

  applyFilters(categoryMatches: Match[] | null = null) {
    let cat = this.filterForm.value.cat;
    let day = this.filterForm.value.day;
    let gym = this.filterForm.value.gym;
    let team = this.filterForm.value.equipo;
    console.log('Applying filters', cat, day, gym, team);

    if (!cat && !day && !gym && !team) return;

    let matches: Match[] = this.allMatches;
    if(categoryMatches) matches = categoryMatches;
    else if(cat) matches = this.allMatches.filter(match => match.category == cat);

    this.filteredMatches = filterMatches(matches, day, gym, team);
    this.filteredMatches = this.filteredMatches.sort((a, b) => (a.day! + a.time!).localeCompare(b.day! + b.time!));
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
    this.filteredTeams = this.teams.filter(e => e.category == match.category);
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


  matchForm = this.fb.group({
    categoria: 'aprendiz',
    hometeam: null,
    visitorteam: null,
    gym: null,
    time: new Date(),
    juego: null,
    bracket: null
  });

newMatchTeams: Team[] = [];
selectedCategoria = "";
phases = ["Grupo 1", "Grupo 2", "Grupo 3", "Grupo 4", "Octavos", "Cuartos", "Semi-Finaless", "Finales", "Standing"]
brackets = ["grupos", "o1", "o2", "o3", "o4", "o5", "o6", "o7", "o8", "q9", "q10", "q11", "q12", "s13", "s14", "f15", "p16", "p17", "p18", "p19", "p20", "p21", "f22" ]
displayStyle = "none";
popUpMsg = "";
newMatchExpanded = false;

// Format must strictly be YYYY-MM-DDTHH:mm
minDateTime = '2026-07-31T00:00';
maxDateTime = '2026-08-02T23:59';
selectedDateTime = '';

async loadTeams() {
}

async filterTeamsNewMatch(){
  this.newMatchTeams= this.teams;

  let cat = "";
  if(this.matchForm.value.categoria != null){
    cat = this.matchForm.value.categoria;
  }
  if(cat != ""){
    let teams : Team[] = []
    this.newMatchTeams.forEach(
      async (team) => {
        if(team.category == cat){
          teams.push(team);
        }
      }
    );
    this.newMatchTeams = teams;
  }
}

async onSubmitNewTeam(){
  try {
    let matchTime = new Date(this.matchForm.value.time!);
    let day = matchTime.getDate()
    await this.matchBuilder.addMatch(this.ddb, this.matchForm.value.categoria!, this.matchForm.value.juego!, this.matchForm.value.bracket!, this.matchForm.value.hometeam!, this.matchForm.value.visitorteam!, day.toString(), this.matchForm.value.time!, this.matchForm.value.gym!)
    console.warn ('Saved sucessfully!')
    this.popUpMsg = "Partido Registrado!";
    this.openPopup();
    this.matchForm.reset();

  } catch (err) {
    console.error("Error Submitting report")
    this.popUpMsg = "Error! Partido no registrado. Intenta otra vez.";
    this.openPopup();
  }
}



toggleFilters(): void {
  this.newMatchExpanded = !this.newMatchExpanded;
}

openPopup() {
  this.displayStyle = "block";
}
closePopup() {
  this.displayStyle = "none";
}

async removeMatch(matchId: string){
  console.log("Deleting match", matchId)
  this.selectedMatch = this.allMatches.filter(m => m.id == matchId)[0];
  if (this.selectedMatch == null) {
    this.errorMsg = "Match not found"
  }
  this.displayConfirmDeleteMatch = "block"
}
closeDeleteMatchPopup() {
  this.displayConfirmDeleteMatch = "none";
  this.errorMsg = "";
}
async confirmDeleteMatch() {
  await this.matchBuilder.deleteMatch(this.ddb, this.selectedMatch!.id!);
  this.displayConfirmDeleteMatch = "none";
  this.errorMsg = "";
  this.allMatches = this.allMatches.filter(m => m.id != this.selectedMatch!.id);
  this.filteredMatches = this.filteredMatches.filter(m => m.id != this.selectedMatch!.id);
}


}  
