import { Component, Input } from '@angular/core';
import { ReporteBuilder } from '../../Builders/reporte-builder';
import { DisplayReport, Reporte, Section, TopAward, TopReporte, SectionType, TopSkillsMap } from '../../interfaces/reporte';
import { AuthService } from '../../auth.service';
import { S3 } from '../../aws-clients/s3';
import { FormBuilder } from '@angular/forms';
import { Category, Player } from '../../interfaces/player';
import { PlayerBuilder } from '../../Builders/player-builder';
import { TeamBuilder } from '../../Builders/team-builder';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { Team } from '../../interfaces/team';

@Component({
  selector: 'app-resultados-evaluacion',
  templateUrl: './resultados-evaluacion.component.html',
  styleUrls: ['./resultados-evaluacion.component.scss']
})
export class ResultadosEvaluacionComponent {
  
  constructor(
  private fb: FormBuilder,
    private reporteBuilder: ReporteBuilder,
    private playerBuilder: PlayerBuilder,
    private teamBuilder: TeamBuilder,
    private authService: AuthService,
  ){}

  topElitePlayers!: TopReporte
  topApprendizPlayers!: TopReporte
  selectedCategoryTop!: TopReporte
  selectedCategory: Category = Category.ELITE
  selectedPlayerReport!: DisplayReport
  selectedPlayer: Player | undefined
  selectedAwardCat: TopAward | undefined | null;
  selectedAwardCatSkills: TopSkillsMap | undefined | null;
  showAvg = true;
  equipos : Team[] = [];
  catEquipos : Team[] = [];
  players : Player[] = [];
  selectedPlayerTeam!: Team;
  loading = true;
  imageUrl: string | ArrayBuffer | null | undefined = "assets/no-avatar.png";

  awardCategories : string[] = []
  
  
  s3!: S3
  @Input() ddb!: DynamoDb;

  async ngOnInit() {

    if(this.authService.isLoggedIn()){
      let user = this.authService.getUserUsername();
      let pass = this.authService.getUserPass();

      let credentials = await this.authService.getCredentials(user, pass)
      if (credentials == undefined) {
        throw Error("AWS Credentials are undefined. Unable to set S3 client")
      }
      this.s3 = await S3.build(credentials)
    }
    this.topApprendizPlayers = await this.reporteBuilder.retriveEvaluationResults(this.s3, Category.APRENDIZ)
    this.topElitePlayers = await this.reporteBuilder.retriveEvaluationResults(this.s3, Category.ELITE)
    this.selectedCategoryTop = this.topElitePlayers
    this.awardCategories = this.selectedCategoryTop.map(c => c.sectionName);
    if(this.selectedCategoryTop.length > 0){
      this.selectedAwardCat = this.selectedCategoryTop[0];
      this.selectedAwardCatSkills = this.selectedAwardCat.skillsTop;
      console.warn("section type: ", this.selectedAwardCat.sectionType)
      if(this.selectedAwardCat.sectionType && this.selectedAwardCat.sectionType == "checkbox"){
        this.showAvg = false;
      }
      else{
        this.showAvg = true;
      }
    }
    console.debug(this.selectedAwardCatSkills)

    this.equipos = await this.teamBuilder.getTeams(this.ddb)
    this.loading = false
    this.applyFilters()
  }

  showElite() {
    this.selectedCategoryTop = this.topElitePlayers
    this.selectedCategory = Category.ELITE
  }

  showAprendiz() {
    this.selectedCategoryTop = this.topApprendizPlayers
    this.selectedCategory = Category.APRENDIZ
  }
  
  switchCategory(cat: string){
    if(cat == Category.APRENDIZ){
      this.showAprendiz()
    }
    else{
      this.showElite()
    }
    this.awardCategories = this.selectedCategoryTop.map(c => c.sectionName);
  }
      
  filterForm = this.fb.group({
    cat: Category.ELITE,
    awardCat: "Nominacion",
    equipo: null,
    player: null,
  });

  async updateSelected(playerId: string){
    let report = await this.reporteBuilder.getPlayerCombinedReport(this.s3, playerId)
    console.warn(report)
    if(!report || report == undefined) {
      console.warn("report not found")
      this.openErrorPopup()
      return
    }
    this.selectedPlayer = await this.playerBuilder.getPlayer(this.ddb, playerId)
    this.selectedPlayerReport = this.reporteBuilder.transformToDisplayReport(report)
    this.selectedPlayerTeam = this.equipos.filter(t => t.id == this.selectedPlayer!.team)[0]

    if (this.selectedPlayer!.imageType ){
      console.log("image type is: ", this.selectedPlayer!.imageType)
      await this.getS3ImgAsBuffer(this.selectedPlayer!.id, this.selectedPlayer!.imageType);
    }  else {
      this.imageUrl = "assets/no-avatar.png"
    }

    this.openPopup();
  }

  async getS3ImgAsBuffer(playerId: string, imgType: string){
    let data = await this.s3.downloadFile(playerId)
    console.log("Downloaded data:", data);

    if (data) {
      let blob = new Blob([data], { type: imgType });
        // display blob as img
      const reader2 = new FileReader();
      reader2.readAsDataURL(blob);
      reader2.onload = () => {
        this.imageUrl = reader2.result;
      };
    } else {
      console.error("No data returned from downloadFile");
      this.imageUrl = "assets/no-avatar.png";
    }
  }

  async applyFilters(){

    this.switchCategory(this.filterForm.value.cat!)
    
    this.catEquipos = this.equipos.filter(e => e.category == this.filterForm.value.cat)
    
    if(this.filterForm.value.equipo) {
      this.players = await this.playerBuilder.getPlayersByTeam(this.ddb, this.filterForm.value.equipo)
    }

    let awardCat = this.filterForm.value.awardCat?.toLowerCase();
    if(awardCat){
      this.selectedAwardCat = this.selectedCategoryTop.find(c => c.sectionName.toLowerCase() == awardCat);
      this.selectedAwardCatSkills = this.selectedAwardCat!.skillsTop;
      console.debug(this.selectedAwardCatSkills)

      console.warn("section type: ", this.selectedAwardCat!.sectionType)
      if(this.selectedAwardCat!.sectionType && this.selectedAwardCat!.sectionType == "checkbox"){
        this.showAvg = false;
      }
      else{
        this.showAvg = true;
      }
    }

    // TODO: filter teams and players based on category/team selection
  }

  displayStyle = "none";
  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    this.selectedPlayerReport = {playerId: "", categoria:"", scouts: []};
    this.displayStyle = "none";
  }
  errordisplayStyle = "none";
  openErrorPopup() {
    this.errordisplayStyle = "block";
  }
  closeErrorPopup() {
    this.errordisplayStyle = "none";
  }
}
