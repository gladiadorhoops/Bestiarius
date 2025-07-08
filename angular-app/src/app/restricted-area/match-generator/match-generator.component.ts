import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { TOURNAMENT_DAYS, TOURNAMENT_YEAR } from 'src/app/aws-clients/constants';
import { GymBuilder } from 'src/app/Builders/gym-builder';
import { Gym } from 'src/app/interfaces/gym';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { MatchBuilder } from '../../Builders/match-builder';
import { TeamBuilder } from '../../Builders/team-builder';
import { Team } from '../../interfaces/team';

@Component({
  selector: 'app-match-generator',
  templateUrl: './match-generator.component.html',
  styleUrls: ['./match-generator.component.scss']
})
export class MatchGeneratorComponent  implements OnInit {
  @Input() ddb!: DynamoDb;

  constructor(private fb: FormBuilder, 
    private matchBuilder: MatchBuilder,
    private gymBuilder: GymBuilder,
    private teamBuilder: TeamBuilder
    ) {
  }

    ngOnInit(): void {
      this.loadGyms()
      this.loadTeams()
    }

    matchForm = this.fb.group({
      categoria: 'aprendiz',
      hometeam: null,
      visitorteam: null,
      gym: null,
      day: null,
      time: null,
      juego: null,
      bracket: null
    });


  teams: Team[] = [];
  filteredTeams: Team[] = [];
  selectedCategoria = "";
  gyms : Gym[] = [];
  phases = ["Grupo 1", "Grupo 2", "Grupo 3", "Grupo 4", "Octavos", "Cuartos", "Semi-Finaless", "Finales", "Standing"]
  brackets = ["grupos", "o1", "o2", "o3", "o4", "o5", "o6", "o7", "o8", "q9", "q10", "q11", "q12", "s13", "s14", "f15", "p16", "p17", "p18", "p19", "p20", "p21", "f22" ]
  days: number[] = TOURNAMENT_DAYS;
  displayStyle = "none";
  popUpMsg = "";

  async loadGyms() {
    this.gyms = []
    let gyms = await this.gymBuilder.getListOfGyms(this.ddb).then(
      (output) => {
        return output
      }
    )
    this.gyms = this.gyms.concat(gyms);
    console.debug("gyms: ", this.gyms);
  }

  async loadTeams() {
    this.teams = []
    let teams = await this.teamBuilder.getTeams(this.ddb).then(
      (output) => {
        return output
      }
    )
    this.teams = this.teams.concat(teams);
    this.filterTeams()
  }

  async filterTeams(){
    this.filteredTeams= this.teams;

    let cat = "";
    if(this.matchForm.value.categoria != null){
      cat = this.matchForm.value.categoria;
    }
    if(cat != ""){
      let teams : Team[] = []
      this.filteredTeams.forEach(
        async (team) => {
          if(team.category == cat){
            teams.push(team);
          }
        }
      );
      this.filteredTeams = teams;
    }
  }

  async onSubmit(){
    try {
      await this.matchBuilder.addEpmtyMatch(this.ddb, this.matchForm.value.categoria!, this.matchForm.value.juego!, this.matchForm.value.bracket!, this.matchForm.value.hometeam!, this.matchForm.value.visitorteam!, this.matchForm.value.day!, this.matchForm.value.time!, this.matchForm.value.gym!)
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



  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    this.displayStyle = "none";
  }
}
