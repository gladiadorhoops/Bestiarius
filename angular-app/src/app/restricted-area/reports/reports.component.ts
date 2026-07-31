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
  scouts: Scout[] = []
  reports: ReportBasic[] = []
  players: Player[] = []
  teams: Team[] = [];


  async ngOnInit() {

    this.scouts = await this.userBuilder.getAllScouts(this.ddb);
    this.scouts = this.scouts.filter(s => s.year === TOURNAMENT_YEAR)

    this.reports = await this.reportBuilder.getAllReportsScoutPlayerMap(this.ddb)

    this.players = await this.playerBuilder.getAllPlayers(this.ddb)

    this.teams = await this.teamBuilder.getTeams(this.ddb, TOURNAMENT_YEAR);

    this.reports.forEach(report => {
      console.log("report scout "+ report.scoutId + " reviewed "+report.playerId)
      let player = this.players.filter(p => p.id == report.playerId)[0]
      report.playerName = player.name
      report.scoutName = this.scouts.filter(s => s.id == report.scoutId)[0].name
      report.teamName = this.teams.filter(s => s.id == player.team)[0].name
    });

    this.reports.sort((a, b) => a.scoutName.localeCompare(b.scoutName))

    this.loading = false;
  }

}
