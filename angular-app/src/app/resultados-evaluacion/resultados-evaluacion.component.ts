import { Component } from '@angular/core';

@Component({
  selector: 'app-resultados-evaluacion',
  templateUrl: './resultados-evaluacion.component.html',
  styleUrls: ['./resultados-evaluacion.component.scss']
})
export class ResultadosEvaluacionComponent {

  top5s = [
    {
      award:"Tiro", 
      topAprendiz : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ],
      topElite : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ]
    },
    {
      award:"Pase", 
      topAprendiz : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ],
      topElite : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ]
    },
    {
      award:"Defensa", 
      topAprendiz : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ],
      topElite : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ]
    },
    {
      award:"Bote", 
      topAprendiz : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ],
      topElite : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ]
    },
    {
      award:"Jugador", 
      topAprendiz : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ],
      topElite : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ]
    }
  ]
  nominations =[
    {
      award:"Maximus", 
      topAprendiz : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ],
      topElite : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ]
    },
    {
      award:"Colosseum", 
      topAprendiz : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ],
      topElite : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ]
    },
    {
      award:"Spartacus", 
      topAprendiz : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ],
      topElite : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ]
    },
    {
      award:"Flamma", 
      topAprendiz : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ],
      topElite : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ]
    },
    {
      award:"Crupelarius CRQ21", 
      topAprendiz : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ],
      topElite : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ]
    },
    {
      award:"Commodus", 
      topAprendiz : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ],
      topElite : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ]
    },
    {
      award:"Crixus", 
      topAprendiz : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ],
      topElite : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ]
    },
    {
      award:"Scutum Shield", 
      topAprendiz : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ],
      topElite : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ]
    },
    {
      award:"Centuriones", 
      topAprendiz : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
      ],
      topElite : [
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
        {Name: "Juan", Points: 5},
        {Name: "Jose", Points: 3},
        {Name: "Daniel", Points: 15},
        {Name: "Luis", Points: 10},
        {Name: "Pedro", Points: 7},
      ]
    }
  ]

  players = [
    {Name: "Daniel", Equipo: "Equipo A", Scouts: 10, Position: [{posicion: "1", votes: 4}, {posicion: "2", votes: 0}, {posicion: "3", votes: 0}, {posicion: "4", votes: 7}, {posicion: "5", votes: 0}], Evalgen: "4.5", Style: [{style: "Anotador", votes: 4}, {style: "Defensor", votes: 0}, {style: "Creador", votes: 0}, {style: "Atletico", votes: 0}, {style: "Clutch", votes: 0}, {style: "Rebotador", votes: 1}, {style: "Rol", votes: 8}]},
    {Name: "Luis", Equipo: "Equipo B", Scouts: 8, Position: [{posicion: "1", votes: 0}, {posicion: "2", votes: 0}, {posicion: "3", votes: 8}, {posicion: "4", votes: 0}, {posicion: "5", votes: 0}], Evalgen: "4.2", Style: [{style: "Anotador", votes: 0}, {style: "Defensor", votes: 6}, {style: "Creador", votes: 0}, {style: "Atletico", votes: 0}, {style: "Clutch", votes: 3}, {style: "Rebotador", votes: 0}, {style: "Rol", votes: 0}]},
    {Name: "Pedro", Equipo: "Equipo C", Scouts: 5, Position: [{posicion: "1", votes: 0}, {posicion: "2", votes: 0}, {posicion: "3", votes: 0}, {posicion: "4", votes: 4}, {posicion: "5", votes: 0}], Evalgen: "4.8", Style: [{style: "Anotador", votes: 0}, {style: "Defensor", votes: 0}, {style: "Creador", votes: 4}, {style: "Atletico", votes: 0}, {style: "Clutch", votes: 0}, {style: "Rebotador", votes: 0}, {style: "Rol", votes: 2}]},
    {Name: "Juan", Equipo: "Equipo D", Scouts: 9, Position: [{posicion: "1", votes: 0}, {posicion: "2", votes: 6}, {posicion: "3", votes: 0}, {posicion: "4", votes: 0}, {posicion: "5", votes: 3}], Evalgen: "3.9", Style: [{style: "Anotador", votes: 0}, {style: "Defensor", votes: 0}, {style: "Creador", votes: 0}, {style: "Atletico", votes: 7}, {style: "Clutch", votes: 0}, {style: "Rebotador", votes: 4}, {style: "Rol", votes: 0}]},
    {Name: "Jose", Equipo: "Equipo A", Scouts: 7, Position: [{posicion: "1", votes: 0}, {posicion: "2", votes: 0}, {posicion: "3", votes: 2}, {posicion: "4", votes: 1}, {posicion: "5", votes: 0}], Evalgen: "4.7", Style: [{style: "Anotador", votes: 0}, {style: "Defensor", votes: 0}, {style: "Creador", votes: 0}, {style: "Atletico", votes: 0}, {style: "Clutch", votes: 1}, {style: "Rebotador", votes: 0}, {style: "Rol", votes: 0}]}
  ]

  selectedPlayer = {Name: "", Equipo: "", Scouts: 0, Position: [{posicion: "1", votes: 0}, {posicion: "2", votes: 0}, {posicion: "3", votes: 0}, {posicion: "4", votes: 0}, {posicion: "5", votes: 0}], Evalgen: "0", Style: [{style: "Anotador", votes: 0}, {style: "Defensor", votes: 0}, {style: "Creador", votes: 0}, {style: "Atletico", votes: 0}, {style: "Clutch", votes: 0}, {style: "Rebotador", votes: 0}, {style: "Rol", votes: 0}]}
    
  updateSelected(playerName: string){
    var localselectedplayer= {Name: "", Equipo: "", Scouts: 0, Position: [{posicion: "1", votes: 0}, {posicion: "2", votes: 0}, {posicion: "3", votes: 0}, {posicion: "4", votes: 0}, {posicion: "5", votes: 0}], Evalgen: "0", Style: [{style: "Anotador", votes: 0}, {style: "Defensor", votes: 0}, {style: "Creador", votes: 0}, {style: "Atletico", votes: 0}, {style: "Clutch", votes: 0}, {style: "Rebotador", votes: 0}, {style: "Rol", votes: 0}]}
    this.players.forEach(function(value){
      if(value.Name == playerName){
        localselectedplayer = value;
      }
    });
    this.selectedPlayer = localselectedplayer;
  }
}
