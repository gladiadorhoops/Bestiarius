import { Component, Input } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Team, getCategories } from '../interfaces/team';
import { Player } from '../interfaces/player';
import { DynamoDb } from '../aws-clients/dynamodb';
import { TeamBuilder } from '../Builders/team-builder';
import { PlayerBuilder } from '../Builders/player-builder';
import { ReporteBuilder } from '../Builders/reporte-builder';
import { Skills, Skill } from '../interfaces/reporte';
import { Scout } from '../interfaces/scout';


@Component({
  selector: 'app-add-player',
  templateUrl: './add-player.component.html',
  styleUrls: ['./add-player.component.scss']
})
export class AddPlayerComponent {

  constructor(private fb: FormBuilder,
    private authService: AuthService,
    private playerBuilder: PlayerBuilder,
    private reporteBuilder: ReporteBuilder,
  ) {
    this.player = {
      id: this.playerId,
      nombre: "",
      equipo: this.equipoId,
      categoria: this.categoria,
      edad: "",
      height: "",
      weight: "",
      posicion: "",
      birthday: new Date()
    }
  }

  @Input() ddb!: DynamoDb;
  @Input() playerId!: string;
  @Input() equipoId!: string;
  @Input() categoria!: string;
  @Input() teamplayers!: Player[];

  playerForm =  this.fb.group(PlayerBuilder.defaultForm);

  scout_id = this.authService.getUserId();
  scout_name = this.authService.getUserName();
  categories = getCategories();

  player: Player;
  displayStyle = "none";

  emptyTxt : string = "";

  async ngOnInit() {

    this.player = {
      id: this.playerId,
      nombre: "",
      equipo: this.equipoId,
      categoria: this.categoria,
      edad: "",
      height: "",
      weight: "",
      posicion: "",
      birthday: new Date()
    }

    this.teamplayers.forEach(p => {
      if(p.id == this.playerId){
        this.player = p;
      }
    });
  }

  getPlayerInput(){
    let inputplayer = {
      equipo: this.equipoId,
      categoria: this.categoria,
      id: this.playerId,
      edad: "",
      nombre: (<HTMLInputElement>document.getElementById("nombre"+this.playerId)).value,
      height: (<HTMLInputElement>document.getElementById("altura"+this.playerId)).value,
      weight: (<HTMLInputElement>document.getElementById("peso"+this.playerId)).value,
      posicion: (<HTMLInputElement>document.getElementById("posicion"+this.playerId)).value,
      birthday: new Date((<HTMLInputElement>document.getElementById("bday"+this.playerId)).value)
    }
    return inputplayer;
  }

  savePlayer(){

    if(document.getElementById("nombre"+this.playerId)){
      this.player = this.getPlayerInput();
      console.log("Saving player: "+this.player.nombre);
      console.log(this.player);
    }
  }
}

