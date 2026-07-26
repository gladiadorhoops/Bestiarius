import { Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AuthService } from '../../auth.service';
import { Team, getCategories } from '../../interfaces/team';
import { Player } from '../../interfaces/player';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { TeamBuilder } from '../../Builders/team-builder';
import { PlayerBuilder } from '../../Builders/player-builder';
import { ReporteBuilder } from '../../Builders/reporte-builder';
import { Skills, Skill } from '../../interfaces/reporte';
import { Scout } from '../../interfaces/scout';
import { Role } from '../../enum/Role';
import { S3 } from 'src/app/aws-clients/s3';
import { Buffer } from 'buffer';
import { TOURNAMENT_YEAR } from 'src/app/aws-clients/constants';

@Component({
  selector: 'app-evaluacion',
  templateUrl: './evaluacion.component.html',
  styleUrls: ['./evaluacion.component.scss']
})
export class EvaluacionComponent implements OnChanges {
  imgBuffer: ArrayBuffer|undefined;
  imgType: string|undefined;

  constructor(private fb: FormBuilder,
    private authService: AuthService,
    private teamBuilder: TeamBuilder,
    private playerBuilder: PlayerBuilder,
    private reporteBuilder: ReporteBuilder,
  ) {}

  @Input() ddb!: DynamoDb;
  // Category and team are driven by the shared filters in the parent (evaluar-partido).
  @Input() category: string | null | undefined = null;
  @Input() team: string | null | undefined = null;

  scout_id = this.authService.getUserId();
  scout_name = this.authService.getUserName();
  categories = getCategories();
  evaluationForm =  this.fb.group(ReporteBuilder.defaultForm);

  teams: Team[] = [];
  teamplayers: Player[] = [];
  playerFilter: string = "";
  showPlayerList: boolean = false;
  selectedCategoria: string = "";

  get filteredPlayers(): Player[] {
    const filter = this.playerFilter.trim().toLowerCase();
    if (!filter) return this.teamplayers;
    return this.teamplayers.filter(p =>
      p.name.toLowerCase().startsWith(filter) || p.number.startsWith(filter)
    );
  }
  selectedPlayer: Player = {id: '', team: '', name:'',age:"",category:'', height:'',weight:'',position:'',number:'',curp:'',liabilityWaiver:'',birthday:''};;
  displayStyle = "none";
  displayPhotoPopup = "none";
  submitReportMessage = "Evaluacion guardada!"

  positions: Skill[] = Skills.getPosiciones()
  tiros: Skill[] = Skills.getTiros()
  pases: Skill[] = Skills.getPases()
  defensas: Skill[] = Skills.getDefensas()
  botes: Skill[] = Skills.getBotes()
  jugadores: Skill [] = Skills.getJugadores()
  estilos: Skill[] = Skills.getEstilos()
  evalGens: Skill[] = Skills.getEvaluaciones()
  nominaciones: Skill[] = Skills.getNominaciones()
  
  @Input() s3!: S3;
  imageUrl: string | ArrayBuffer | null | undefined = "assets/no-avatar.png";
  blob: Blob | undefined
  onFileSelected(event: any): void {
    console.log("Selected File Changed")
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = async () => {
        try {
          this.imgBuffer = reader.result as ArrayBuffer
          this.imgType = file.type
          // set image preview locally
          this.imageUrl = URL.createObjectURL(file);
          if(this.selectedPlayer.imageType){
            this.openPhotoPopup()
          }
          else {
            await this.confirmReplacePhoto()
          }
          
        } catch (e) {
          console.log("error", e);
        }

      };
    } else {
      console.log("No file selected.");
    }
  }

  openPhotoPopup() {
    this.displayPhotoPopup = "block";
  }
  async closePhotoPopup(){
    await this.getS3ImgAsBuffer(this.selectedPlayer.id, this.selectedPlayer.imageType!);
    this.displayPhotoPopup = "none";
  }
  async confirmReplacePhoto(){
    try{
      await this.s3.uploadFile(
        this.selectedPlayer.id,
        Buffer.from(this.imgBuffer!),
        this.imgType!,
      );
      // update player entry with image
      if(this.selectedPlayer.imageType != this.imgType!){
        this.selectedPlayer.imageType = this.imgType!
        await this.playerBuilder.updatePlayerImageType(this.ddb, this.selectedPlayer.id, this.imgType!)
      }
    } catch (e) {
      console.log("error", e);
    }
    this.displayPhotoPopup = "none";
  }
  
  async ngOnInit() {
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes['category']) {
      this.evaluationForm.controls['categoria'].setValue(this.category ?? '');
      await this.loadTeams();
    }
    if (changes['team']) {
      this.evaluationForm.controls['equipo'].setValue(this.team ?? '');
      await this.loadPlayers();
    }
  }

  async onSubmit() {
    // TODO: Use EventEmitter with form value
    console.log(this.evaluationForm.value);

    try {
      await this.reporteBuilder.submit(this.ddb, this.evaluationForm)
      this.submitReportMessage = "Evaluación guardada"
    } catch (err) {
      this.submitReportMessage = `Error guardando evaluación. Contacta a Paco.\n${err}`
      console.error("Error Submitting report")
    }
    
    this.openPopup();
  }

  async loadTeams() {
    this.teams = []
    this.selectedCategoria = this.evaluationForm.value.categoria!
    let teams = await this.teamBuilder.getTeamsByCategory(this.ddb, this.selectedCategoria).then(
      (output) => {
        return output
      }
    )
    this.teams = this.teams.concat(teams)
    this.teamplayers = [];
    this.selectedPlayer = {id: '', team: '', name:'',age:"",category:'', height:'',weight:'',position:'',number:'',curp:'',liabilityWaiver:'',birthday:''};
    this.playerFilter = "";
    this.showPlayerList = false;
    this.imageUrl = "assets/no-avatar.png"
  }

  async loadPlayers() {
    var selectedTeam = this.evaluationForm.value.equipo;
    this.teams.forEach(
      async (team) => {
        if(team.name == selectedTeam){
          this.teamplayers = await this.playerBuilder.getPlayersByTeam(this.ddb, team.id!).then(
            (players) => {
              return players.filter(p => p.year == TOURNAMENT_YEAR)
            }
          )
        }
    });
    this.selectedPlayer = {id: '', team: '', name:'',age:"",category:'', height:'',weight:'',position:'',number:'',curp:'',liabilityWaiver:'',birthday:''};
    this.playerFilter = "";
    this.showPlayerList = false;
    this.imageUrl = "assets/no-avatar.png"
  }

  async selectPlayer(player: Player) {
    this.selectedPlayer = player;
    this.playerFilter = player.name;
    this.showPlayerList = false;
    this.evaluationForm.controls['playerId'].setValue(player.id);
    await this.loadPlayerDetails();
  }

  onPlayerFilterChange(value: string) {
    this.playerFilter = value;
    this.showPlayerList = true;
  }

  hidePlayerList() {
    // Delay so a click on a list item registers before the list hides
    setTimeout(() => this.showPlayerList = false, 200);
  }

  async loadPlayerDetails() {
    var selectedPlayerId = this.evaluationForm.value.playerId;

    this.selectedPlayer = this.teamplayers.find(p => p.id == selectedPlayerId)!;

    let scout: Scout = {
      id: this.scout_id,
      name: this.scout_name,
      phone: "",
      email: "",
      role: Role.SCOUT
    }

    this.evaluationForm = await this.reporteBuilder.getReport(
      this.ddb, scout, this.selectedPlayer.id, this.evaluationForm.value.equipo!, this.selectedCategoria,
    )

    if (this.selectedPlayer.imageType ){
      console.log("image type is: ", this.selectedPlayer.imageType)
      await this.getS3ImgAsBuffer(this.selectedPlayer.id, this.selectedPlayer.imageType);
    }  else {
      this.imageUrl = "assets/no-avatar.png"
    }
  }

  async getS3ImgAsBuffer(playerId: string, imgType: string){
    let data = await this.s3.downloadFile(playerId)
    console.log("Downloaded data:", data);

    if (data) {
      this.blob = new Blob([data], { type: imgType });
        // display blob as img
      const reader2 = new FileReader();
      reader2.readAsDataURL(this.blob);
      reader2.onload = () => {
        this.imageUrl = reader2.result;
      };
    } else {
      console.error("No data returned from downloadFile");
      this.imageUrl = "assets/no-avatar.png";
    }
  }

  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    this.displayStyle = "none";
  }
}

