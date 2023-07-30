import { Component, Input } from '@angular/core';
import { ReporteBuilder } from '../Builders/reporte-builder';
import { DisplayReport, Reporte, TopReporte } from '../interfaces/reporte';
import { AuthService } from '../auth.service';
import { S3 } from '../aws-clients/s3';
import { FormBuilder } from '@angular/forms';
import { Category, Player } from '../interfaces/player';
import { PlayerBuilder } from '../Builders/player-builder';
import { TeamBuilder } from '../Builders/team-builder';
import { DynamoDb } from '../aws-clients/dynamodb';
import { Team } from '../interfaces/team';

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
  equipos : Team[] = [];
  players : Player[] = [];
  selectedPlayerTeam!: Team;
  loading = true;
  
  s3!: S3
  @Input() ddb!: DynamoDb;

  async ngOnInit() {

    if(this.authService.isLoggedIn()){
      let user = this.authService.getScoutName();
      let pass = this.authService.getScoutPass();
      this.s3 = await S3.build(user, pass)
    }
    this.topApprendizPlayers = await this.reporteBuilder.retriveEvaluationResults(this.s3, Category.APRENDIZ)
    this.topElitePlayers = await this.reporteBuilder.retriveEvaluationResults(this.s3, Category.ELITE)
    this.selectedCategoryTop = this.topElitePlayers
    this.equipos = await this.teamBuilder.getListOfTeams(this.ddb)
    this.loading = false
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
  }
      
  filterForm = this.fb.group({
    cat: "",
    player: null,
    equipo: null
  });

  async updateSelected(playerId: string){
    let report = await this.reporteBuilder.getPlayerCombinedReport(this.s3, playerId)
    if(report == undefined) return
    this.selectedPlayer = await this.playerBuilder.getPlayer(this.ddb, playerId)
    this.selectedPlayerReport = this.reporteBuilder.transformToDisplayReport(report)
    this.selectedPlayerTeam = this.equipos.filter(t => t.id == this.selectedPlayer!.equipo)[0]
    this.openPopup();
  }

  applyFilters(){
    //if (this.filterForm.value.cat == Category.APRENDIZ){
    //  this.players = 
    //}
    //if(this.filterForm.value.cat == Category.ELITE){
    //
    //}
    // TODO: filter teams and players based on category/team selection
  }

  displayStyle = "none";
  openPopup() {
    this.displayStyle = "block";
  }
  closePopup() {
    this.displayStyle = "none";
  }
}
