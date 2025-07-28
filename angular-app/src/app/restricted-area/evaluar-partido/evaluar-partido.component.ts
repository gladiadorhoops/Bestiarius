import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../../interfaces/match';
import { FormBuilder } from '@angular/forms';
import { MatchBuilder } from '../../Builders/match-builder';
import { TeamBuilder } from '../../Builders/team-builder';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { Team, MatchTeam } from '../../interfaces/team';
import { TOURNAMENT_DAYS, TOURNAMENT_YEAR } from 'src/app/aws-clients/constants';
import { Gym } from 'src/app/interfaces/gym';
import { GymBuilder } from 'src/app/Builders/gym-builder';
import { PlayerBuilder } from 'src/app/Builders/player-builder';
import { Player, PlayerWithPhoto } from 'src/app/interfaces/player';
import { S3 } from 'src/app/aws-clients/s3';
import { Skill, Skills } from 'src/app/interfaces/reporte';
import { ReporteBuilder } from 'src/app/Builders/reporte-builder';
import { AuthService } from 'src/app/auth.service';


@Component({
  selector: 'app-evaluar-partido',
  templateUrl: './evaluar-partido.component.html',
  styleUrls: ['./evaluar-partido.component.scss']
})
export class EvaluarPartidoComponent implements OnInit {
  @Input() ddb!: DynamoDb;
  @Input() s3!: S3;

  scout_id = this.authService.getUserId();
  scout_name = this.authService.getUserName();

  days: number[] = TOURNAMENT_DAYS;
  allMatches: Match[] = [];
  matchesAprendizDays: Match[][] = [];
  matchesEliteDays: Match[][] = [];
  todayDay = new Date().getDate();
  gyms : Gym[] = [];


  equipos : Team[] = [];
  filteredMatches: Match[] = [];

  isTeamSelected: boolean = false;
  isEvaluatingPlayer: boolean = false;
  loading: boolean = true;
  editingTeam: MatchTeam = {id: "", name: "", category: ""};
  displayEvalPlayer = "none";
  selectedPlayer: PlayerWithPhoto | undefined;
  displayPhotoPopup = "none";
  displayStyle = "none";


  positions: Skill[] = Skills.getPosiciones()
  tiros: Skill[] = Skills.getTiros()
  pases: Skill[] = Skills.getPases()
  defensas: Skill[] = Skills.getDefensas()
  botes: Skill[] = Skills.getBotes()
  jugadores: Skill [] = Skills.getJugadores()
  estilos: Skill[] = Skills.getEstilos()
  evalGens: Skill[] = Skills.getEvaluaciones()
  nominaciones: Skill[] = Skills.getNominaciones()
  evaluationForm =  this.fb.group(ReporteBuilder.defaultForm);
  submitReportMessage = "Evaluacion guardada!"

  
  imgBuffer: ArrayBuffer|undefined;
  imgType: string|undefined;

  constructor(private fb: FormBuilder, 
    private matchBuilder: MatchBuilder,
    private teamBuilder: TeamBuilder,
    private gymBuilder: GymBuilder,
    private playerBuilder: PlayerBuilder,
    private reporteBuilder: ReporteBuilder,
    private authService: AuthService,
    private httpService: HttpClient
    ) {
  }

  filterForm = this.fb.group({
    cat: null,
    day: null,
    gym: null,
    equipo: null
  });

  marcadorForm = this.fb.group({
    homeScore : [0],
    visitorScore : [0]
  });

  async ngOnInit() {
    this.gyms = await this.gymBuilder.getListOfGyms(this.ddb, TOURNAMENT_YEAR);
    await this.loadMatches();
  }  
  
  async loadMatches(){
    this.allMatches = await this.matchBuilder.getListOfMatch(this.ddb, TOURNAMENT_YEAR)
    this.equipos = await this.teamBuilder.getTeams(this.ddb)
    this.filteredMatches = this.allMatches;
    this.filteredMatches = this.filteredMatches.sort((a, b) => (a.day! + a.time!).localeCompare(b.day! + b.time!))
    this.loading = false;
  }

  applyFilters() {
    this.filteredMatches = this.allMatches;


    let day = "";
    if(this.filterForm.value.day != null){
      day = this.filterForm.value.day;
    }

    if(day != ""){
      let matches : Match[] = []
      this.filteredMatches.forEach(
        async (match) => {
          if(match.day == day){
            matches.push(match);
          }
        }
      );
      this.filteredMatches = matches;
    }

    let gym = "";
    if(this.filterForm.value.gym != null){
      gym = this.filterForm.value.gym;
    }

    if(gym != ""){
      let matches : Match[] = []
      this.filteredMatches.forEach(
        async (match) => {
          if(match.location.id == gym){
            matches.push(match);
          }
        }
      );
      this.filteredMatches = matches;
    }

    this.filteredMatches = this.filteredMatches.sort((a, b) => (a.day! + a.time!).localeCompare(b.day! + b.time!))
    console.log(day);
    console.log(gym);
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

  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    this.displayStyle = "none";
  }
  

  async edit(team:MatchTeam){
    this.editingTeam = team;

    await this.loadTeam(this.editingTeam.id)

    this.isTeamSelected = true;
  }

  closeTeam(){
    this.isTeamSelected = false;
  }

  async evalPlayer(player:PlayerWithPhoto){
    console.log("Editing player ", player.name)
    this.selectedPlayer = player
    this.isEvaluatingPlayer = true
    this.displayEvalPlayer = "block"
  }

  closeEvalPopup(){
    this.displayEvalPlayer = "none"
    this.isEvaluatingPlayer = false
    this.selectedPlayer = undefined
  }

  confirm(){
    this.closeEvalPopup()
  }

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
          this.selectedPlayer!.imageUrl = URL.createObjectURL(file);
          if(this.selectedPlayer!.imageType){
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
    await this.getS3ImgAsBuffer(this.selectedPlayer!);
    this.displayPhotoPopup = "none";
  }
  async confirmReplacePhoto(){
    try{
      await this.s3.uploadFile(
        this.selectedPlayer!.id,
        Buffer.from(this.imgBuffer!),
        this.imgType!,
      );
      // update player entry with image
      if(this.selectedPlayer!.imageType != this.imgType!){
        this.selectedPlayer!.imageType = this.imgType!
        await this.playerBuilder.updatePlayerImageType(this.ddb, this.selectedPlayer!.id, this.imgType!)
      }
    } catch (e) {
      console.log("error", e);
    }
    this.displayPhotoPopup = "none";
  }

  team: Team | undefined;
  players: PlayerWithPhoto[] = [];
  async loadTeam(teamId: string){
    this.players = []
    this.team = await this.teamBuilder.getTeam(this.ddb, teamId);
    
    let teamPlayers = await this.playerBuilder.getPlayersByTeam(this.ddb, teamId);
    teamPlayers = teamPlayers.filter((p: Player) => p.year! === this.team!.year!);
    await teamPlayers.forEach(async element => {
      let p = element as PlayerWithPhoto
      if (p.imageType ){
        await this.getS3ImgAsBuffer(p);
      }  else {
        p.imageUrl = "assets/no-avatar.png"
      }
      this.players.push(p)
    });
  }

  async getS3ImgAsBuffer(player: PlayerWithPhoto){
    let data = await this.s3.downloadFile(player.id)
    console.log("Downloaded data:", data);

    if (data) {
      let blob = new Blob([data], { type: player.imageType });
        // display blob as img
      const reader2 = new FileReader();
      reader2.readAsDataURL(blob);
      reader2.onload = () => {
        player.imageUrl = reader2.result;
      };
    } else {
      console.error("No data returned from downloadFile");
      player.imageUrl = "assets/no-avatar.png";
    }
  }

  goBack(){
    this.isTeamSelected = false;
    this.marcadorForm.reset();
  }

}  
