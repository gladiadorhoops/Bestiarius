import { Component, Input } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AuthService } from '../../../auth.service';
import { getCategories } from '../../../interfaces/team';
import { Category, Player } from '../../../interfaces/player';
import { DynamoDb } from '../../../aws-clients/dynamodb';
import { PlayerBuilder } from '../../../Builders/player-builder';
import { ReporteBuilder } from '../../../Builders/reporte-builder';
import { S3 } from 'src/app/aws-clients/s3';
import { Buffer } from 'buffer';

@Component({
  selector: 'app-add-player',
  templateUrl: './add-player.component.html',
  styleUrls: ['./add-player.component.scss']
})
export class AddPlayerComponent {
  imgToUpload: Buffer | undefined ;

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
  @Input() s3!: S3;

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




  imageUrl: string | ArrayBuffer | null | undefined = "assets/no-avatar.png";
  blob: Blob | undefined
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async () => {
        try {
          this.imgToUpload = Buffer.from(reader.result as ArrayBuffer);
          // set image preview locally
          this.imageUrl = URL.createObjectURL(file);

          // update player entry with image type
          if(this.player.imageType != file.type){
            this.player.imageType = file.type
          }
        } catch (e) {
          console.log("error", e);
        }

      };
    } else {
      console.log("No file selected.");
    }
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
      birthday: new Date((<HTMLInputElement>document.getElementById("bday"+this.playerId)).value),
      imageType: this.player.imageType? this.player.imageType : ""
    }
    return inputplayer;
  }

  async loadPlayer(playerId: string){
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
    
    let existingPlayer = this.teamplayers.find(p => p.id === playerId)
    if (existingPlayer){
      this.player = existingPlayer;
      console.log("found:", existingPlayer.name);
    }

    if (this.player.imageType){
      await this.s3.downloadFile(this.player.id).then((data) => {
        console.log("Downloaded data:", data);
        if (data) {
          this.blob = new Blob([data], { type: this.player.imageType });
            // display blob as img
          const reader2 = new FileReader();
          reader2.readAsDataURL(this.blob);
          reader2.onload = () => {
          this.imageUrl = reader2.result;
        };
        } else {
          this.imageUrl = "assets/no-avatar.png";
          console.error("No data returned from downloadFile");
        }
      })
    }  else {
      this.imageUrl = "assets/no-avatar.png"
    }
  }

  async savePlayer(){
    if(this.player.imageType){
      await this.s3.uploadFile(
        this.player.id,
        this.imgToUpload!,
        this.player.imageType!,
      );
      console.log("File uploaded")
    }

    if(document.getElementById("nombre"+this.playerId)){
      this.player = this.getPlayerInput();
      console.log("Saving player: "+this.player.name);
      console.log(this.player);
    }
  }
}

