import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../auth.service';
import { getCategories } from '../../../interfaces/team';
import { Category, Player } from '../../../interfaces/player';
import { DynamoDb } from '../../../aws-clients/dynamodb';
import { PlayerBuilder } from '../../../Builders/player-builder';
import { ReporteBuilder } from '../../../Builders/reporte-builder';
import { S3, LIABILITY_WAIVER_PATH } from 'src/app/aws-clients/s3';
import { Buffer } from 'buffer';
import { TOURNAMENT_YEAR } from 'src/app/aws-clients/constants';

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
    private sanitizer: DomSanitizer
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
      number: "",
      curp: "",
      liabilityWaiver: "",
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
  positions = PlayerBuilder.positions;
  selectedPositions: Record<string, boolean> = {};
  player: Player;
  displayStyle = "none";
  emptyTxt : string = "";
  imageUrl: string | ArrayBuffer | null | undefined = "assets/no-avatar.png";
  blob: Blob | undefined

  waiverToUpload: {data: Buffer, contentType: string} | undefined;
  waiverError: string = "";
  displayWaiver = "none";
  loadingWaiver = false;
  waiverUrl: string | undefined;
  waiverSafeUrl: SafeResourceUrl | undefined;
  waiverIsPdf = false;

  // The parent only hides this component's modal (it is never destroyed), so
  // the file inputs must be cleared by hand when switching players.
  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;
  @ViewChild('waiverInput') waiverInput?: ElementRef<HTMLInputElement>;

  async ngOnInit() {
    this.loadPlayer(this.playerId);
  }


  async loadPlayer(playerId: string){
    // Drop any file picked for the previously opened player, otherwise it would
    // be uploaded under this player's id on "Confirmar".
    this.clearPendingUploads();

    let existingPlayer = this.teamplayers.find(p => p.id === playerId)
    if (existingPlayer){
      this.player = existingPlayer;
      console.log("found:", existingPlayer.name);
      this.playerForm.controls.bday.setValue(this.player.birthday)
    } else {
      this.player = this.playerBuilder.getEmptyPlayer()
      this.player.id = playerId;
    }

    this.playerForm.controls.nombre.setValue(this.player.name)
    this.playerForm.controls.equipo.setValue(this.player.team)
    this.playerForm.controls.categoria.setValue(this.player.category)
    this.playerForm.controls.altura.setValue(this.player.height)
    this.playerForm.controls.peso.setValue(this.player.weight)
    this.playerForm.controls.numero.setValue(this.player.number)
    this.playerForm.controls.curp.setValue(this.player.curp)

    this.selectedPositions = {};
    this.player.position.split(',').map(p => p.trim()).filter(p => p).forEach(p => {
      this.selectedPositions[p] = true;
    });

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


  // Reset every piece of pending upload state (buffers, errors, previews and the
  // native file inputs) so nothing leaks from one player to the next.
  clearPendingUploads(){
    this.imgToUpload = undefined;
    this.waiverToUpload = undefined;
    this.waiverError = "";
    this.blob = undefined;
    this.closeLiabilityWaiver();
    if (this.photoInput) {
      this.photoInput.nativeElement.value = "";
    }
    if (this.waiverInput) {
      this.waiverInput.nativeElement.value = "";
    }
  }

  // Jersey numbers are at most 3 digits. `maxlength` alone does not cover
  // pasted text or non-digit characters, so strip anything else as it is typed.
  onJerseyInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '').slice(0, 3);
    if (digits !== input.value) {
      input.value = digits;
    }
    this.playerForm.controls.numero.setValue(digits);
  }

  togglePosition(position: string): void {
    this.selectedPositions[position] = !this.selectedPositions[position];
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
    this.player.number = this.playerForm.value.numero ?? ""
    this.player.curp = this.playerForm.value.curp!
    this.player.position = this.positions.filter(p => this.selectedPositions[p]).join(',')

    this.player.birthday = this.playerForm.value.bday!;
  }

  async savePlayerPhoto(){
    console.log(`Saving player photo: ${this.player.name} - ${this.player.id}`);
    if(this.player.imageType && this.imgToUpload){
      await this.s3.uploadFile(
        this.player.id,
        this.imgToUpload!,
        this.player.imageType!,
      );
      console.log("Player photo uploaded")
      this.imgToUpload = undefined
    }
  }

  onWaiverSelected(event: any): void {
    const file: File = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      this.waiverError = "El archivo debe ser una imagen o un PDF.";
      return;
    }

    this.waiverError = "";
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      this.waiverToUpload = {
        data: Buffer.from(reader.result as ArrayBuffer),
        contentType: file.type
      };
    };
  }

  async saveLiabilityWaiver(){
    if (this.waiverToUpload) {
      await this.playerBuilder.uploadLiabilityWaiver(
        this.ddb,
        this.s3,
        this.player.id,
        this.waiverToUpload.data,
        this.waiverToUpload.contentType
      );
      this.player.liabilityWaiver = PlayerBuilder.getLiabilityWaiverFileName(this.player.id);
      this.waiverToUpload = undefined;
    }
  }

  async openLiabilityWaiver(){
    this.waiverUrl = undefined;
    this.waiverError = "";
    this.loadingWaiver = true;
    this.displayWaiver = "block";

    if (this.player.liabilityWaiver) {
      const result = await this.s3.downloadFileWithType(this.player.liabilityWaiver, LIABILITY_WAIVER_PATH);
      if (result) {
        this.waiverIsPdf = result.contentType === 'application/pdf';
        const blob = new Blob([result.data as any], {type: result.contentType});
        this.waiverUrl = URL.createObjectURL(blob);
        this.waiverSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.waiverUrl);
      } else {
        this.waiverError = "No se pudo cargar la carta responsiva.";
      }
    } else {
      this.waiverError = "No se ha subido una carta responsiva.";
    }
    this.loadingWaiver = false;
  }

  closeLiabilityWaiver(){
    this.displayWaiver = "none";
    this.waiverUrl = undefined;
    this.waiverSafeUrl = undefined;
  }
}

