import { Component, Input, ViewChild } from '@angular/core';
import { AuthService } from '../../auth.service';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { TeamBuilder } from '../../Builders/team-builder';
import { Team } from '../../interfaces/team';
import { UserBuilder } from '../../Builders/user-builder';
import { Player } from 'src/app/interfaces/player';
import { PlayerBuilder } from 'src/app/Builders/player-builder';
import { TOURNAMENT_YEAR } from 'src/app/aws-clients/constants';
import { S3 } from 'src/app/aws-clients/s3';
import { AddPlayerComponent } from '../view-teams/add-player/add-player.component';

@Component({
  selector: 'app-list-players',
  templateUrl: './list-players.component.html',
  styleUrls: ['./list-players.component.scss']
})
export class ListPlayersComponent {
    player: Player | undefined;

    constructor(
        private authService: AuthService,
        private teamBuilder: TeamBuilder,
        private userBuilder: UserBuilder,
        private playerBuilder: PlayerBuilder
      ){}


    @Input() ddb!: DynamoDb;
    @Input() s3!: S3;

    loading = true;
    teams: Team[] = [];
    uTeams: Map<string,string> = new Map<string, string>();

    isAdmin = false;
    isScout = false;
    isCoach = false;
    userId = "";
    userrole = "";
    players: Player[] = [];

    // Filters
    filtersExpanded = false;
    positions = PlayerBuilder.positions;
    filterName = "";
    filterCurp = "";
    filterTeam = "";
    filterPositions: Record<string, boolean> = {};
    filterHeightMin = "";
    filterHeightMax = "";
    filterWeightMin = "";
    filterWeightMax = "";
    filterYearMin = "";
    filterYearMax = "";

    reloadLoginStatus() {
      this.userrole = this.authService.getUserRole();
      this.userId = this.authService.getUserId();

      this.isAdmin = false;
      this.isScout = false;
      this.isCoach = false;

      if(this.userrole == "admin"){
        this.isAdmin = true;
        this.isScout = true;
        this.isCoach = true;
      }
      if(this.userrole == "scout"){
        this.isScout = true;
      }
      if(this.userrole == "coach"){
        this.isCoach = true;
      }
    }

    async refreshTeams(){
      this.reloadLoginStatus()

      this.teams = await this.teamBuilder.getTeams(this.ddb, TOURNAMENT_YEAR);

      this.teams.forEach(team => {
        this.uTeams.set(team.id, team.name);
      });
    }

    async ngOnInit() {
      await this.refreshTeams();

      this.players = await this.playerBuilder.getAllPlayers(this.ddb);
      this.sortBy('team')

      this.loading = false;
    }

    sortColumn = "";
    sortAsc = true;

    sortBy(column: string){
      // Toggle direction when re-clicking the same column, otherwise start ascending
      if (this.sortColumn === column) {
        this.sortAsc = !this.sortAsc;
      } else {
        this.sortColumn = column;
        this.sortAsc = true;
      }
      const dir = this.sortAsc ? 1 : -1;
      this.players = this.players.sort((a, b) => dir * this.compareByColumn(a, b, column));
    }

    private compareByColumn(a: Player, b: Player, column: string): number {
      switch (column) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return (a.category ?? "").localeCompare(b.category ?? "");
        case 'team': {
          const ta = this.uTeams.get(a.team) ?? 'no-team';
          const tb = this.uTeams.get(b.team) ?? 'no-team';
          return ta.localeCompare(tb);
        }
        case 'height':
        case 'weight': {
          const raw = (p: Player) => column === 'height' ? p.height : p.weight;
          const va = raw(a) ? parseFloat(raw(a)) : NaN;
          const vb = raw(b) ? parseFloat(raw(b)) : NaN;
          const aEmpty = isNaN(va);
          const bEmpty = isNaN(vb);
          if (aEmpty && bEmpty) return 0;
          // Players without a value always sort last, regardless of direction
          if (aEmpty) return this.sortAsc ? 1 : -1;
          if (bEmpty) return this.sortAsc ? -1 : 1;
          return va - vb;
        }
        default:
          return 0;
      }
    }

    sortIndicator(column: string): string {
      if (this.sortColumn !== column) return '';
      return this.sortAsc ? ' ▲' : ' ▼';
    }

    // ---- Filtering ----
    get filteredPlayers(): Player[] {
      return this.players.filter(p => this.matchesFilters(p));
    }

    private matchesFilters(p: Player): boolean {
      const name = this.filterName.trim().toLowerCase();
      if (name && !p.name.toLowerCase().includes(name)) return false;

      const curp = this.filterCurp.trim().toLowerCase();
      if (curp && !(p.curp ?? "").toLowerCase().includes(curp)) return false;

      if (this.filterTeam && p.team !== this.filterTeam) return false;

      const selectedPositions = this.positions.filter(pos => this.filterPositions[pos]);
      if (selectedPositions.length > 0) {
        const playerPositions = (p.position ?? "").split(',').map(x => x.trim());
        if (!selectedPositions.some(pos => playerPositions.includes(pos))) return false;
      }

      if (!this.inNumericRange(p.height, this.filterHeightMin, this.filterHeightMax)) return false;
      if (!this.inNumericRange(p.weight, this.filterWeightMin, this.filterWeightMax)) return false;
      if (!this.inNumericRange(this.getBirthYear(p.birthday), this.filterYearMin, this.filterYearMax)) return false;

      return true;
    }

    private inNumericRange(rawValue: string, min: string, max: string): boolean {
      const hasMin = min.trim() !== "";
      const hasMax = max.trim() !== "";
      if (!hasMin && !hasMax) return true;

      const value = parseFloat(rawValue);
      if (isNaN(value)) return false; // no value to compare against an active bound

      if (hasMin && value < parseFloat(min)) return false;
      if (hasMax && value > parseFloat(max)) return false;
      return true;
    }

    private getBirthYear(birthday: string): string {
      if (!birthday) return "";
      const year = birthday.slice(0, 4);
      return /^\d{4}$/.test(year) ? year : "";
    }

    toggleFilters(): void {
      this.filtersExpanded = !this.filtersExpanded;
    }

    // Number of active filters, shown as a badge on the collapsed toggle.
    get activeFilterCount(): number {
      let count = 0;
      if (this.filterName.trim()) count++;
      if (this.filterCurp.trim()) count++;
      if (this.filterTeam) count++;
      if (this.positions.some(pos => this.filterPositions[pos])) count++;
      if (this.filterHeightMin.trim() || this.filterHeightMax.trim()) count++;
      if (this.filterWeightMin.trim() || this.filterWeightMax.trim()) count++;
      if (this.filterYearMin.trim() || this.filterYearMax.trim()) count++;
      return count;
    }

    toggleFilterPosition(position: string): void {
      this.filterPositions[position] = !this.filterPositions[position];
    }

    clearFilters(): void {
      this.filterName = "";
      this.filterCurp = "";
      this.filterTeam = "";
      this.filterPositions = {};
      this.filterHeightMin = "";
      this.filterHeightMax = "";
      this.filterWeightMin = "";
      this.filterWeightMax = "";
      this.filterYearMin = "";
      this.filterYearMax = "";
    }

    // ---- Player detail (reuses the team-view editable player component) ----
    @ViewChild(AddPlayerComponent) addPlayerViewChild!: AddPlayerComponent;
    displayPlayer = "none"

    closePlayerPopup(){
      this.player = undefined
      this.displayPlayer = "none"
    }

    showPlayer(player: Player){
      console.log("Showing player: ", player.name)
      // Setting `player` creates the embedded app-add-player (behind *ngIf),
      // whose ngOnInit loads this player's details from its bound inputs.
      this.player = player
      this.displayPlayer = "block"
    }

    async confirmEditPlayer(){
      this.addPlayerViewChild.getPlayerInput();
      let updatedPlayer = this.addPlayerViewChild.player;
      await this.playerBuilder.createPlayer(this.ddb, updatedPlayer);
      await this.addPlayerViewChild.savePlayerPhoto();
      await this.addPlayerViewChild.saveLiabilityWaiver();
      this.players = await this.playerBuilder.getAllPlayers(this.ddb);
      this.closePlayerPopup();
    }

  }
