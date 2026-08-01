import { Component, Input } from '@angular/core';
import { ReporteBuilder } from '../../Builders/reporte-builder';
import { DisplayReport, ReportBasic, ReportSectionView, TopAward, TopReporte, TopSkillsMap } from '../../interfaces/reporte';
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
  allPlayers: Player[] = [];
  selectedPlayerTeam!: Team;
  loading = true;
  imageUrl: string | ArrayBuffer | null | undefined = "assets/no-avatar.png";
  myEvaluations: ReportBasic[] = [];
  myEvaluationsDisplayStyle = "none";
  myEvaluationDetailDisplayStyle = "none";
  selectedMyEvaluationReport: ReportBasic | undefined;
  myEvaluationSections: ReportSectionView[] = [];
  myEvaluationGeneral = "";
  loadingMyEvaluation = false;

  get playerModalSummaryRows() {
    const scoutsText = (this.selectedPlayerReport?.scouts || []).map(s => s.name).join(', ');
    const generalText = this.getGeneralText(this.selectedPlayerReport?.general);

    return [
      { label: 'Nombre', value: this.selectedPlayer?.name || '' },
      { label: 'Scouts', value: `(${this.selectedPlayerReport?.scouts.length || 0}): ${scoutsText}` },
      { label: 'Equipo', value: this.selectedPlayerTeam?.name || '' },
      { label: 'Evaluacion General', value: generalText }
    ];
  }

  get playerModalSections(): ReportSectionView[] {
    if (!this.selectedPlayerReport) return [];

    const sections: ReportSectionView[] = [];
    if (this.selectedPlayerReport.posicion) {
      sections.push(this.buildSectionView('posicion', 'Posicion (Votos):', false, this.selectedPlayerReport.posicion.skill));
    }
    if (this.selectedPlayerReport.estilo) {
      sections.push(this.buildSectionView('estilo', 'Estilo de Juego (Votos):', false, this.selectedPlayerReport.estilo.skill));
    }
    if (this.selectedPlayerReport.tiro) {
      sections.push(this.buildSectionView('tiro', 'Tiro (Promedio):', false, this.selectedPlayerReport.tiro.skill));
    }
    if (this.selectedPlayerReport.defensa) {
      sections.push(this.buildSectionView('defensa', 'Defensa (Promedio):', false, this.selectedPlayerReport.defensa.skill));
    }
    if (this.selectedPlayerReport.jugador) {
      sections.push(this.buildSectionView('jugador', 'Jugador (Promedio):', false, this.selectedPlayerReport.jugador.skill));
    }
    if (this.selectedPlayerReport.pase) {
      sections.push(this.buildSectionView('pase', 'Pase (Promedio):', false, this.selectedPlayerReport.pase.skill));
    }
    if (this.selectedPlayerReport.bote) {
      sections.push(this.buildSectionView('bote', 'Bote (Promedio):', false, this.selectedPlayerReport.bote.skill));
    }
    if (this.selectedPlayerReport.nominacion) {
      sections.push(this.buildSectionView('nominacion', 'Nominaciones (Votos):', true, this.selectedPlayerReport.nominacion.skill));
    }
    return sections;
  }

  private buildSectionView(section: string, title: string, fullWidth: boolean, skills: Array<{ label?: string; localized?: string; report?: string; value?: number | string | boolean | undefined }>): ReportSectionView {
    return {
      section,
      title,
      fullWidth,
      valueOnly: false,
      skills: skills.map(skill => ({
        label: skill.localized ?? skill.report ?? '',
        value: this.formatSkillValue(skill.value)
      }))
    };
  }

  private getGeneralText(section: { skill?: Array<{ avg?: number | string | boolean | undefined }> } | undefined): string {
    if (!section?.skill?.length) return '';
    const firstSkill = section.skill[0];
    return this.formatSkillValue(firstSkill.avg);
  }

  private formatSkillValue(value: number | string | boolean | undefined): string {
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    return value === undefined || value === null ? '' : `${value}`;
  }

  get myEvaluationSummaryRows() {
    return [
      { label: 'Nombre', value: this.selectedMyEvaluationReport?.playerName || '' },
      { label: 'Equipo', value: `${this.selectedMyEvaluationReport?.teamName || ''}${this.selectedMyEvaluationReport?.category ? ` (${this.selectedMyEvaluationReport.category})` : ''}` },
      { label: 'Evaluacion General', value: this.myEvaluationGeneral }
    ];
  }

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
    this.allPlayers = await this.playerBuilder.getAllPlayers(this.ddb)
    await this.loadMyEvaluations()
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

  async loadMyEvaluations() {
    const scoutId = "14f83458-60d1-7009-3100-ceed52e4f344";//this.authService.getUserId() || this.authService.getUserUsername();
    const reports = await this.reporteBuilder.getAllReportsScoutPlayerMap(this.ddb);

    this.myEvaluations = reports
      .filter(report => report.scoutId === scoutId)
      .map(report => {
        const player = this.allPlayers.find(player => player.id === report.playerId);
        return {
          ...report,
          playerNumber: player?.number ? player.number : "#",
          playerName: player?.name ?? report.playerId,
          teamName: this.equipos.find(team => team.id === player?.team)?.name ?? "",
          scoutName: this.authService.getUserName() || report.scoutId,
        };
      })
      .sort((a, b) => a.playerName.localeCompare(b.playerName));
  }

  openMyEvaluationsModal() {
    this.myEvaluationsDisplayStyle = "block";
  }

  closeMyEvaluationsModal() {
    this.myEvaluationsDisplayStyle = "none";
  }

  async selectMyEvaluation(report: ReportBasic) {
    this.selectedMyEvaluationReport = report;
    this.myEvaluationSections = [];
    this.myEvaluationGeneral = "";
    this.loadingMyEvaluation = true;
    this.myEvaluationDetailDisplayStyle = "block";

    this.loadPlayerPhoto(report.playerId);

    const view = await this.reporteBuilder.getScoutPlayerReport(this.ddb, report.scoutId, report.playerId);
    this.myEvaluationSections = view.sections;
    this.myEvaluationGeneral = view.general;
    this.loadingMyEvaluation = false;
  }

  closeMyEvaluationDetailModal() {
    this.selectedMyEvaluationReport = undefined;
    this.myEvaluationSections = [];
    this.myEvaluationGeneral = "";
    this.myEvaluationDetailDisplayStyle = "none";
    this.imageUrl = "assets/no-avatar.png";
  }

  loadPlayerPhoto(playerId: string) {
    this.imageUrl = "assets/no-avatar.png";

    const player = this.allPlayers.find(player => player.id === playerId);
    if (!player?.imageType || !this.s3) return;

    this.s3.downloadFile(playerId).then(data => {
      if (!data) return;
      const blob = new Blob([data], {type: player.imageType});
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => this.imageUrl = reader.result;
    });
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
