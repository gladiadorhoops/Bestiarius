import { Component, Input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../auth.service';
import { getCategories } from '../../../interfaces/team';
import { Category, Player } from '../../../interfaces/player';
import { DynamoDb } from '../../../aws-clients/dynamodb';
import { PlayerBuilder } from '../../../Builders/player-builder';
import { ReporteBuilder } from '../../../Builders/reporte-builder';
import { S3 } from 'src/app/aws-clients/s3';
import { Buffer } from 'buffer';
import { TOURNAMENT_YEAR } from 'src/app/aws-clients/constants';
import { DatePipe } from '@angular/common'

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
    private datepipe: DatePipe
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
      birthday: ""
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
  imageUrl: string | ArrayBuffer | null | undefined = "assets/no-avatar.png";
  blob: Blob | undefined

  async ngOnInit() {
    this.imgToUpload = undefined
    this.loadPlayer(this.playerId);
  }


  async loadPlayer(playerId: string){
    this.player = this.playerBuilder.getEmptyPlayer()
    
    let existingPlayer = this.teamplayers.find(p => p.id === playerId)
    if (existingPlayer){
      this.player = existingPlayer;
      console.log("found:", existingPlayer.name);
    }

    this.playerForm.controls.nombre.setValue(this.player.name)
    this.playerForm.controls.equipo.setValue(this.player.team)
    this.playerForm.controls.categoria.setValue(this.player.category)
    this.playerForm.controls.altura.setValue(this.player.height)
    this.playerForm.controls.peso.setValue(this.player.weight)
    let bday = new Date(this.player.birthday)
    this.playerForm.controls.bday.setValue(this.datepipe.transform(bday, 'yyyy-MM-dd')!)
    this.playerForm.controls.posicion.setValue(this.player.position)

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

  getPlayerInput(){
    this.player.team = this.equipoId
    this.player.category = this.categoria
    this.player.id = this.playerId
    this.player.name = this.playerForm.value.nombre!
    this.player.height = this.playerForm.value.altura!
    this.player.weight = this.playerForm.value.peso!
    this.player.position = this.playerForm.value.posicion!
    
    let localDate = new Date(this.playerForm.value.bday!)
    let bday = new Date(localDate.getTime() + (localDate.getTimezoneOffset() * 60000))

    console.log("bday: ", bday)

    this.player.birthday = this.datepipe.transform(bday, 'yyyy-MM-dd')!;
  }

  async savePlayer(){
    if(this.player.imageType && this.imgToUpload){
      await this.s3.uploadFile(
        this.player.id,
        this.imgToUpload!,
        this.player.imageType!,
      );
      console.log("File uploaded")
      this.imgToUpload = undefined
    }

    this.getPlayerInput();
    console.log("Saving player: "+this.player.name);
    console.log(this.player);
  }
}

