import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
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
    private teamBuilder: TeamBuilder
    ) {
  }

    ngOnInit(): void {
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
  gyms = ['Gimnasio Nuevo', 'Gimnasio Tecnológico', 'Cancha Sindicato', 'Gimnasio Municipal', 'Gimnasio Municipal (afuera)', 'Gimnasio Federal'];
  phases = ["Grupo 1", "Grupo 2", "Grupo 3", "Grupo 4", "Octavos", "Cuartos", "Semi-Finaless", "Finales", "Standing"]


  async loadTeams() {
    this.teams = []
    let teams = await this.teamBuilder.getTeamsByCategory(this.ddb).then(
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
    } catch (err) {
      console.error("Error Submitting report")
    }
  }
}
