import { Component } from '@angular/core';
import { ReporteBuilder } from '../Builders/reporte-builder';
import { TopReporte } from '../interfaces/reporte';
import { AuthService } from '../auth.service';
import { S3 } from '../aws-clients/s3';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-resultados-evaluacion',
  templateUrl: './resultados-evaluacion.component.html',
  styleUrls: ['./resultados-evaluacion.component.scss']
})
export class ResultadosEvaluacionComponent {

  constructor(
  private fb: FormBuilder,
    private reporteBuilder: ReporteBuilder,
    private authService: AuthService, 
  ){}

  topPlayers!: TopReporte
  s3!: S3

  async ngOnInit() {

    if(this.authService.isLoggedIn()){
      let user = this.authService.getScoutName();
      let pass = this.authService.getScoutPass();
      this.s3 = await S3.build(user, pass)
    }
    this.topPlayers = await this.reporteBuilder.retriveEvaluationResults(this.s3)
  }

  equipos = [{"name":"Equipo A"}, {"name":"Equipo B"}, {"name":"Equipo C"}, {"name":"Equipo D"}]

  players = [
    {Name: "Daniel", Equipo: "Equipo A", Scouts: 10, Position: [{posicion: "1", votes: 4}, {posicion: "2", votes: 0}, {posicion: "3", votes: 0}, {posicion: "4", votes: 7}, {posicion: "5", votes: 0}], Evalgen: "4.5", Style: [{style: "Anotador", votes: 4}, {style: "Defensor", votes: 0}, {style: "Creador", votes: 0}, {style: "Atletico", votes: 0}, {style: "Clutch", votes: 0}, {style: "Rebotador", votes: 1}, {style: "Rol", votes: 8}],skills: [{Name: "Tiro", Points: 3},{Name: "Pase", Points: 0},{Name: "Defensa", Points: 0},{Name: "Bote", Points: 0},{Name: "Jugador", Points: 0}], nominations: [{Name: "Maximus", Points: 0}]},
    {Name: "Luis", Equipo: "Equipo B", Scouts: 8, Position: [{posicion: "1", votes: 0}, {posicion: "2", votes: 0}, {posicion: "3", votes: 8}, {posicion: "4", votes: 0}, {posicion: "5", votes: 0}], Evalgen: "4.2", Style: [{style: "Anotador", votes: 0}, {style: "Defensor", votes: 6}, {style: "Creador", votes: 0}, {style: "Atletico", votes: 0}, {style: "Clutch", votes: 3}, {style: "Rebotador", votes: 0}, {style: "Rol", votes: 0}],skills: [{Name: "Tiro", Points: 0},{Name: "Pase", Points: 0},{Name: "Defensa", Points: 9},{Name: "Bote", Points: 0},{Name: "Jugador", Points: 0}], nominations: [{Name: "Maximus", Points: 2}]},
    {Name: "Pedro", Equipo: "Equipo C", Scouts: 5, Position: [{posicion: "1", votes: 0}, {posicion: "2", votes: 0}, {posicion: "3", votes: 0}, {posicion: "4", votes: 4}, {posicion: "5", votes: 0}], Evalgen: "4.8", Style: [{style: "Anotador", votes: 0}, {style: "Defensor", votes: 0}, {style: "Creador", votes: 4}, {style: "Atletico", votes: 0}, {style: "Clutch", votes: 0}, {style: "Rebotador", votes: 0}, {style: "Rol", votes: 2}],skills: [{Name: "Tiro", Points: 0},{Name: "Pase", Points: 0},{Name: "Defensa", Points: 0},{Name: "Bote", Points: 0},{Name: "Jugador", Points: 0}], nominations: [{Name: "Maximus", Points: 0}]},
    {Name: "Juan", Equipo: "Equipo D", Scouts: 9, Position: [{posicion: "1", votes: 0}, {posicion: "2", votes: 6}, {posicion: "3", votes: 0}, {posicion: "4", votes: 0}, {posicion: "5", votes: 3}], Evalgen: "3.9", Style: [{style: "Anotador", votes: 0}, {style: "Defensor", votes: 0}, {style: "Creador", votes: 0}, {style: "Atletico", votes: 7}, {style: "Clutch", votes: 0}, {style: "Rebotador", votes: 4}, {style: "Rol", votes: 0}],skills: [{Name: "Tiro", Points: 0},{Name: "Pase", Points: 0},{Name: "Defensa", Points: 0},{Name: "Bote", Points: 0},{Name: "Jugador", Points: 0}], nominations: [{Name: "Maximus", Points: 4}]},
    {Name: "Jose", Equipo: "Equipo A", Scouts: 7, Position: [{posicion: "1", votes: 0}, {posicion: "2", votes: 0}, {posicion: "3", votes: 2}, {posicion: "4", votes: 1}, {posicion: "5", votes: 0}], Evalgen: "4.7", Style: [{style: "Anotador", votes: 0}, {style: "Defensor", votes: 0}, {style: "Creador", votes: 0}, {style: "Atletico", votes: 0}, {style: "Clutch", votes: 1}, {style: "Rebotador", votes: 0}, {style: "Rol", votes: 0}],skills: [{Name: "Tiro", Points: 0},{Name: "Pase", Points: 0},{Name: "Defensa", Points: 0},{Name: "Bote", Points: 0},{Name: "Jugador", Points: 0}], nominations: [{Name: "Maximus", Points: 0}]}
  ]

  selectedPlayer = {Name: "", Equipo: "", Scouts: 0, Position: [{posicion: "1", votes: 0}, {posicion: "2", votes: 0}, {posicion: "3", votes: 0}, {posicion: "4", votes: 0}, {posicion: "5", votes: 0}], Evalgen: "0", Style: [{style: "Anotador", votes: 0}, {style: "Defensor", votes: 0}, {style: "Creador", votes: 0}, {style: "Atletico", votes: 0}, {style: "Clutch", votes: 0}, {style: "Rebotador", votes: 0}, {style: "Rol", votes: 0}],skills: [{Name: "Tiro", Points: 0},{Name: "Pase", Points: 0},{Name: "Defensa", Points: 0},{Name: "Bote", Points: 0},{Name: "Jugador", Points: 0}], nominations: [{Name: "Maximus", Points: 0}]}
    
  filterForm = this.fb.group({
    cat: null,
    player: null,
    equipo: null
  });

  updateSelected(playerName: string){
    var localselectedplayer= {Name: "", Equipo: "", Scouts: 0, Position: [{posicion: "1", votes: 0}, {posicion: "2", votes: 0}, {posicion: "3", votes: 0}, {posicion: "4", votes: 0}, {posicion: "5", votes: 0}], Evalgen: "0", Style: [{style: "Anotador", votes: 0}, {style: "Defensor", votes: 0}, {style: "Creador", votes: 0}, {style: "Atletico", votes: 0}, {style: "Clutch", votes: 0}, {style: "Rebotador", votes: 0}, {style: "Rol", votes: 0}],skills: [{Name: "Tiro", Points: 0},{Name: "Pase", Points: 0},{Name: "Defensa", Points: 0},{Name: "Bote", Points: 0},{Name: "Jugador", Points: 0}], nominations: [{Name: "Maximus", Points: 0}]}
    this.players.forEach(function(value){
      if(value.Name == playerName){
        localselectedplayer = value;
      }
    });
    this.selectedPlayer = localselectedplayer;
  }

  applyFilters(){
    // TODO: filter teams and players based on category/team selection
  }
}
