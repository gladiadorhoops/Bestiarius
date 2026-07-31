import { Component, Input } from '@angular/core';
import { AuthService } from '../../auth.service';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { UserBuilder } from '../../Builders/user-builder';
import { ReporteBuilder } from '../../Builders/reporte-builder';
import { Role } from 'src/app/enum/Role';
import { TOURNAMENT_YEAR } from 'src/app/aws-clients/constants';
import { Scout } from 'src/app/interfaces/scout';
import { ReportBasic } from 'src/app/interfaces/reporte';
import { PlayerBuilder } from 'src/app/Builders/player-builder';
import { Player } from 'src/app/interfaces/player';
import { TeamBuilder } from 'src/app/Builders/team-builder';
import { Team } from 'src/app/interfaces/team';

export interface User {
  id: string
  name: string
  phone: string
  email: string
  role: string
  year: string
  other: string
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent {

  constructor(
      private authService: AuthService,
      private userBuilder: UserBuilder,
      private teamBuilder: TeamBuilder,
      private reportBuilder: ReporteBuilder,
      private playerBuilder: PlayerBuilder
    ){}


  @Input() ddb!: DynamoDb;
  loading = true;
  reports: ReportBasic[] = []
  teamsMap: Map<string,string> = new Map<string, string>();
  playersMap: Map<string,Player> = new Map<string, Player>();
  scoutsMap: Map<string,string> = new Map<string, string>();



  async ngOnInit() {

    let scouts = await this.userBuilder.getAllScouts(this.ddb);
    scouts = scouts.filter(s => s.year === TOURNAMENT_YEAR);
    scouts.forEach(scout => {
      this.scoutsMap.set(scout.id, scout.name);
    });

    this.reports = await this.reportBuilder.getAllReportsScoutPlayerMap(this.ddb)

    let players = await this.playerBuilder.getAllPlayers(this.ddb)
    players.forEach(player => {
      this.playersMap.set(player.id, player);
    });

    let teams = await this.teamBuilder.getTeams(this.ddb, TOURNAMENT_YEAR);
    teams.forEach(team => {
      this.teamsMap.set(team.id, team.name);
    });

    this.reports.forEach(report => {
      console.log("report scout "+ report.scoutId + " reviewed "+report.playerId)
      let player = this.playersMap.get(report.playerId);
      report.playerName = player?.name!
      report.scoutName = this.scoutsMap.get(report.scoutId)!
      report.teamName = this.teamsMap.get(player?.team!)!
    });

    this.reports.sort((a, b) => a.scoutName.localeCompare(b.scoutName))

    this.loading = false;
  }

}
