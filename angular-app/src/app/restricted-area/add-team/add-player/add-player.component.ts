import { Component, Input } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AuthService } from '../../../auth.service';
import { getCategories } from '../../../interfaces/team';
import { Category, Player } from '../../../interfaces/player';
import { DynamoDb } from '../../../aws-clients/dynamodb';
import { PlayerBuilder } from '../../../Builders/player-builder';
import { ReporteBuilder } from '../../../Builders/reporte-builder';

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
      name: "",
      team: this.equipoId,
      category: this.categoria,
      age: "",
      height: "",
      weight: "",
      position: "",
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
    this.loadPlayer(this.playerId);
  }

  getPlayerInput(): Player{
    let inputplayer = {
      team: this.equipoId,
      category: this.categoria,
      id: this.playerId,
      age: "",
      name: (<HTMLInputElement>document.getElementById("nombre"+this.playerId)).value,
      height: (<HTMLInputElement>document.getElementById("altura"+this.playerId)).value,
      weight: (<HTMLInputElement>document.getElementById("peso"+this.playerId)).value,
      position: (<HTMLInputElement>document.getElementById("position"+this.playerId)).value,
      birthday: new Date((<HTMLInputElement>document.getElementById("bday"+this.playerId)).value)
    }
    return inputplayer;
  }

  loadPlayer(playerId: string){
    this.player = {
      id: this.playerId,
      name: "",
      team: this.equipoId,
      category: this.categoria,
      age: "",
      height: "",
      weight: "",
      position: "",
      birthday: new Date()
    }
    
    this.teamplayers.forEach(p => {
      if(p.id == playerId){
        this.player = p;
      }
    });
  }
  savePlayer(){

    if(document.getElementById("nombre"+this.playerId)){
      this.player = this.getPlayerInput();
      console.log("Saving player: "+this.player.name);
      console.log(this.player);
    }
  }
}

