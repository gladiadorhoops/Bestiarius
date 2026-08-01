import { Component, Input } from '@angular/core';
import { AuthService } from '../../auth.service';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { UserBuilder } from '../../Builders/user-builder';
import { ReporteBuilder } from '../../Builders/reporte-builder';
import { Role } from 'src/app/enum/Role';
import { TOURNAMENT_YEAR } from 'src/app/aws-clients/constants';
import { Scout } from 'src/app/interfaces/scout';
import { PlayerReports, ReportBasic, ReportSectionView, ScoutReports } from 'src/app/interfaces/reporte';
import { S3 } from 'src/app/aws-clients/s3';
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
  @Input() s3!: S3;
  loading = true;
  reports: ReportBasic[] = []
  // One row per scout with the reports that scout submitted.
  scoutReports: ScoutReports[] = []
  // The same reports grouped the other way: one row per scouted player.
  playerReports: PlayerReports[] = []
  teamsMap: Map<string,string> = new Map<string, string>();
  playersMap: Map<string,Player> = new Map<string, Player>();
  // Keyed by scout id; holds the full record so the list can show contact info.
  scoutsMap: Map<string,Scout> = new Map<string, Scout>();

  // Which of the two lists is showing. Scouts first — it's the view that answers
  // "who still owes reports", which is what the page is mostly used for.
  view: 'scouts' | 'players' = 'scouts';

  // Name search over whichever list is showing: scout names under Por Scout,
  // player names under Por Jugador. One box rather than two, since only one list
  // is ever visible.
  filterName = "";

  // Drill-down state. Either list drills into the same report modal: pick a scout
  // to see the players they reported on, or a player to see the scouts who
  // reported on them, then pick the other side to open the report itself.
  selectedScout: ScoutReports | undefined;
  selectedPlayer: PlayerReports | undefined;
  selectedReport: ReportBasic | undefined;
  reportSections: ReportSectionView[] = [];
  reportGeneral = "";
  loadingReport = false;
  displayStyle = "none";
  imageUrl: string | ArrayBuffer | null | undefined = "assets/no-avatar.png";


  async ngOnInit() {

    let scouts = await this.userBuilder.getAllScouts(this.ddb);
    scouts = scouts.filter(s => s.year === TOURNAMENT_YEAR);
    scouts.forEach(scout => {
      this.scoutsMap.set(scout.id, scout);
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
      let player = this.playersMap.get(report.playerId);
      report.playerNumber = player?.number ? player.number : "#"
      report.playerName = player?.name ?? report.playerId
      report.scoutName = this.scoutsMap.get(report.scoutId)?.name ?? report.scoutId
      report.teamName = this.teamsMap.get(player?.team!)!
    });

    this.groupReportsByScout()
    this.groupReportsByPlayer()

    this.loading = false;
  }

  // Collapse the flat report list into one entry per scout, each holding that
  // scout's reports sorted by player name. Every registered scout gets a row —
  // seeded from scoutsMap — so scouts who haven't submitted anything show up
  // with a count of 0.
  groupReportsByScout() {
    let grouped: Map<string, ScoutReports> = new Map<string, ScoutReports>();

    this.scoutsMap.forEach((scout, scoutId) => {
      grouped.set(scoutId, {scoutId: scoutId, scoutName: scout.name, email: scout.email, phone: scout.phone, reports: []})
    });

    this.reports.forEach(report => {
      let entry = grouped.get(report.scoutId)
      if (entry == undefined) {
        entry = {scoutId: report.scoutId, scoutName: report.scoutName, email: "", phone: "", reports: []}
        grouped.set(report.scoutId, entry)
      }
      entry.reports.push(report)
    });

    this.scoutReports = Array.from(grouped.values())
    this.scoutReports.forEach(scout => {
      scout.reports.sort((a, b) => a.playerName.localeCompare(b.playerName))
    })
    // Most productive scouts first; ties fall back to name so the order is stable.
    this.scoutReports.sort((a, b) =>
      b.reports.length - a.reports.length || a.scoutName.localeCompare(b.scoutName))
  }

  // Same collapse as groupReportsByScout(), pivoted to the player. Driven off the
  // reports rather than the player roster, so only scouted players get a row —
  // every report has a player, so nothing is lost.
  groupReportsByPlayer() {
    let grouped: Map<string, PlayerReports> = new Map<string, PlayerReports>();

    this.reports.forEach(report => {
      let entry = grouped.get(report.playerId)
      if (entry == undefined) {
        entry = {
          playerId: report.playerId,
          playerName: report.playerName,
          playerNumber: report.playerNumber,
          teamName: report.teamName,
          category: report.category,
          reports: []
        }
        grouped.set(report.playerId, entry)
      }
      entry.reports.push(report)
    });

    this.playerReports = Array.from(grouped.values())
    this.playerReports.forEach(player => {
      player.reports.sort((a, b) => a.scoutName.localeCompare(b.scoutName))
    })
    // Most-reported players first; ties fall back to name so the order is stable.
    this.playerReports.sort((a, b) =>
      b.reports.length - a.reports.length || a.playerName.localeCompare(b.playerName))
  }

  // Rows of the visible list that match the name search. Same getter-based
  // filtering as Jugadores Registrados, so the box takes effect as it's typed.
  get filteredScoutReports(): ScoutReports[] {
    let name = this.filterName.trim().toLowerCase();
    if (!name) return this.scoutReports;
    return this.scoutReports.filter(scout => scout.scoutName.toLowerCase().includes(name));
  }

  get filteredPlayerReports(): PlayerReports[] {
    let name = this.filterName.trim().toLowerCase();
    if (!name) return this.playerReports;
    return this.playerReports.filter(player => player.playerName.toLowerCase().includes(name));
  }

  // Reports counted across the rows actually listed, so the total agrees with the
  // column above it once the search narrows the list. Unfiltered, either list
  // covers every report, so this is the tournament-wide count.
  get totalReports(): number {
    let counts = this.view == 'players'
      ? this.filteredPlayerReports.map(player => player.reports.length)
      : this.filteredScoutReports.map(scout => scout.reports.length);
    return counts.reduce((sum, count) => sum + count, 0);
  }

  // Switching lists drops any drill-down, so the other list always opens at its
  // top level rather than mid-navigation. The search goes with it: the two lists
  // search different names, so carrying a scout name over to the player list
  // would open it apparently empty.
  showView(view: 'scouts' | 'players') {
    if (this.view == view) return;
    this.view = view;
    this.filterName = "";
    this.backToList();
  }

  selectScout(scout: ScoutReports) {
    if (scout.reports.length == 0) return;
    this.selectedScout = scout;
    this.closeReport();
  }

  selectPlayer(player: PlayerReports) {
    if (player.reports.length == 0) return;
    this.selectedPlayer = player;
    this.closeReport();
  }

  // Back out of whichever drill-down is open, to that list's top level.
  backToList() {
    this.selectedScout = undefined;
    this.selectedPlayer = undefined;
    this.closeReport();
  }

  async selectReport(report: ReportBasic) {
    this.selectedReport = report;
    this.reportSections = [];
    this.reportGeneral = "";
    this.loadingReport = true;
    this.displayStyle = "block";

    this.loadPlayerPhoto(report.playerId);

    let view = await this.reportBuilder.getScoutPlayerReport(this.ddb, report.scoutId, report.playerId)
    this.reportSections = view.sections;
    this.reportGeneral = view.general;
    this.loadingReport = false;
  }

  // Show the player's photo in the modal, falling back to the default avatar.
  loadPlayerPhoto(playerId: string) {
    this.imageUrl = "assets/no-avatar.png";

    let player = this.playersMap.get(playerId);
    if (!player?.imageType || !this.s3) return;

    this.s3.downloadFile(playerId).then(data => {
      if (!data) return;
      const blob = new Blob([data], {type: player!.imageType});
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => this.imageUrl = reader.result;
    });
  }

  closeReport() {
    this.selectedReport = undefined;
    this.reportSections = [];
    this.reportGeneral = "";
    this.displayStyle = "none";
    this.imageUrl = "assets/no-avatar.png";
  }

}
