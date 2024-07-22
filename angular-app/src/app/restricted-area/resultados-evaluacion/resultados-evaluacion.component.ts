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
  topSkillsElitePlayers: TopSkillsMap[] = []
  topSkillsApprendizPlayers: TopSkillsMap[] = []
  selectedCategoryTop!: TopReporte
  selectedCategorySkillTop!: TopSkillsMap[]
  selectedCategory: Category = Category.ELITE
  selectedPlayerReport!: DisplayReport
  selectedPlayer: Player | undefined
  selectedAwardCat: TopAward | undefined | null;
  equipos : Team[] = [];
  catEquipos : Team[] = [];
  players : Player[] = [];
  selectedPlayerTeam!: Team;
  loading = true;

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
    this.topApprendizPlayers.forEach( topAward => {
      if(topAward.sectionType == SectionType.CHECKBOX) this.topSkillsApprendizPlayers.push(topAward.skillsTop)
    })
    this.topElitePlayers = await this.reporteBuilder.retriveEvaluationResults(this.s3, Category.ELITE)
    this.topElitePlayers.forEach( topAward => {
      if(topAward.sectionType == SectionType.CHECKBOX) this.topSkillsElitePlayers.push(topAward.skillsTop)
    })
    this.selectedCategoryTop = this.topElitePlayers
    this.selectedCategorySkillTop = this.topSkillsElitePlayers
    this.awardCategories = this.selectedCategoryTop.map(c => c.sectionName);
    this.selectedAwardCat = this.selectedCategoryTop[0];

    this.equipos = await this.teamBuilder.getTeams(this.ddb)
    this.loading = false
    this.applyFilters()
  }

  showElite() {
    this.selectedCategoryTop = this.topElitePlayers
    this.selectedCategorySkillTop = this.topSkillsElitePlayers
    this.selectedCategory = Category.ELITE
  }

  showAprendiz() {
    this.selectedCategoryTop = this.topApprendizPlayers
    this.selectedCategorySkillTop = this.topSkillsApprendizPlayers
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
    awardCat: "Tiro",
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
    this.openPopup();
  }

  async applyFilters(){

    this.switchCategory(this.filterForm.value.cat!)

    let awardCat = this.filterForm.value.awardCat?.toLowerCase();
    if(awardCat){
      this.selectedAwardCat = this.selectedCategoryTop.find(c => c.sectionName.toLowerCase() == awardCat);
    }
    
    this.catEquipos = this.equipos.filter(e => e.category == this.filterForm.value.cat)
    
    if(this.filterForm.value.equipo) {
      this.players = await this.playerBuilder.getPlayersByTeam(this.ddb, this.filterForm.value.equipo)
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
