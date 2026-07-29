import { Component, Input, OnInit } from '@angular/core';
import { Match } from '../../interfaces/match';
import { FormBuilder } from '@angular/forms';
import { MatchBuilder } from '../../Builders/match-builder';
import { TeamBuilder } from '../../Builders/team-builder';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { Team, MatchTeam, MatchTeamWithPhoto } from '../../interfaces/team';
import { TOURNAMENT_DAYS, TOURNAMENT_YEAR } from 'src/app/aws-clients/constants';
import { Gym } from 'src/app/interfaces/gym';
import { GymBuilder } from 'src/app/Builders/gym-builder';
import { PlayerBuilder } from 'src/app/Builders/player-builder';
import { Player, PlayerWithPhoto } from 'src/app/interfaces/player';
import { S3 } from 'src/app/aws-clients/s3';
import { filterMatches } from 'src/app/utils/utils';


@Component({
  selector: 'app-scouting',
  templateUrl: './scouting.component.html',
  styleUrls: ['./scouting.component.scss']
})
export class ScoutingComponent implements OnInit {
  @Input() ddb!: DynamoDb;
  @Input() s3!: S3;

  days: number[] = TOURNAMENT_DAYS;
  allMatches: Match[] = [];
  matchesAprendizDays: Match[][] = [];
  matchesEliteDays: Match[][] = [];
  todayDay = new Date().getDate();
  gyms : Gym[] = [];


  equipos : Team[] = [];
  filteredMatches: Match[] = [];
  filteredTeams: Team[] = [];
  // Team logo URLs keyed by team id (falls back to the gray default logo).
  teamLogos: Map<string, string | ArrayBuffer | null | undefined> = new Map();

  activeTab: 'partido' | 'jugador' | 'equipos' | 'estadisticas' = 'partido';
  isTeamSelected: boolean = false;
  isEvaluatingPlayer: boolean = false;
  isScouting: boolean = false;
  scoutingMatch: Match = {location: {id: "", name: ""}, time: "", datetime: new Date(), juego: "", visitorTeam: {id: "", name: "", category: ""}, visitorPoints: "0", homeTeam: {id: "", name: "", category: ""}, homePoints:"0"};
  loading: boolean = true;
  editingTeam: MatchTeamWithPhoto = {id: "", name: "", category: "", imageUrl: ""};
  displayEvalPlayer = "none";
  // Player clicked from the roster; passed to the shared <app-evaluacion>.
  selectedPlayer: PlayerWithPhoto | undefined;

  constructor(private fb: FormBuilder,
    private matchBuilder: MatchBuilder,
    private teamBuilder: TeamBuilder,
    private gymBuilder: GymBuilder,
    private playerBuilder: PlayerBuilder,
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

  // Category for the Jugador tab: use the selected filter, or derive it from
  // the selected team so a player can be evaluated without picking a category.
  get evaluacionCategory(): string | null {
    if (this.filterForm.value.cat) {
      return this.filterForm.value.cat;
    }
    const teamName = this.filterForm.value.equipo;
    if (teamName) {
      const team = this.equipos.find(t => t.name == teamName);
      return team?.category ?? null;
    }
    return null;
  }

  async ngOnInit() {
    this.gyms = await this.gymBuilder.getListOfGyms(this.ddb, TOURNAMENT_YEAR);
    await this.loadMatches();
  }

  selectTab(tab: 'partido' | 'jugador' | 'equipos' | 'estadisticas') {
    this.activeTab = tab;
    // Reset any open "players with images" roster (used by the scouting page
    // and the Equipos detail view) so it doesn't linger when switching tabs.
    this.isScouting = false;
    this.isTeamSelected = false;
    this.editingTeam = {id: "", name: "", category: "", imageUrl: ""};
    this.players = [];
    this.team = undefined;
  }

  
  async loadMatches(){
    this.allMatches = await this.matchBuilder.getListOfMatch(this.ddb, TOURNAMENT_YEAR)
    // TODO: update filter
    const THREE_HOURS_IN_MS: number = 3 * 60 * 60 * 1000;
    this.allMatches = this.allMatches.filter(m => m.datetime?.getTime()! > Date.now()-THREE_HOURS_IN_MS)
    this.equipos = await this.teamBuilder.getTeams(this.ddb)
    this.filteredMatches = this.allMatches.sort((a, b) => (a.datetime!.toISOString().localeCompare(b.datetime!.toISOString())));
    this.filteredTeams = this.equipos;
    this.applyCategoryFilter();
    this.loadTeamLogos();
    this.loading = false;
  }

  // Load each team's logo from S3 into the teamLogos map so the Equipos list
  // can show a small logo before the team name.
  loadTeamLogos(){
    this.equipos.forEach(team => {
      if (!this.teamLogos.has(team.id)) {
        this.teamLogos.set(team.id, "assets/logo_gray.png");
      }
      if (team.imageType) {
        this.s3.downloadFile(TeamBuilder.getLogoFilePath(team.id)).then(data => {
          if (data) {
            const blob = new Blob([data], { type: team.imageType });
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => this.teamLogos.set(team.id, reader.result);
          }
        });
      }
    });
  }

  teamLogo(teamId: string): string | ArrayBuffer | null | undefined {
    return this.teamLogos.get(teamId) ?? "assets/logo_gray.png";
  }

  applyCategoryFilter() {
    this.filteredMatches = this.allMatches;
    this.filteredTeams = this.equipos;

    let cat = this.filterForm.value.cat
    console.log(`Applying filter`, cat);

    if(cat){
      this.filteredMatches = this.filteredMatches.filter(match => match.category == cat);
      this.filteredTeams = this.filteredTeams.filter(team => team.category == cat);
    }
    // if category is changed we should clear existing filter on teams because teams
    // only exist for a specific category
    this.filterForm.get('equipo')?.reset()
    this.applyFilters(this.filteredMatches);
  }

  clearFilters() {
    this.filterForm.reset();
    this.applyCategoryFilter();
  }

  applyFilters(categoryMatches: Match[] | null = null) {
    let cat = this.filterForm.value.cat;
    let day = this.filterForm.value.day;
    let gym = this.filterForm.value.gym;
    let team = this.filterForm.value.equipo;
    console.log('Applying filters', cat, day, gym, team);

    if (!cat && !day && !gym && !team) {
      this.filteredMatches = this.allMatches;
      return;
    }

    let matches: Match[] = this.allMatches;
    if(categoryMatches) matches = categoryMatches;
    else if(cat) matches = this.allMatches.filter(match => match.category == cat);

    this.filteredMatches = filterMatches(matches, day, gym, team);
  }

  async scout(match:Match){
    this.scoutingMatch = match;
    if(match.homePoints){
      this.marcadorForm.controls.homeScore.setValue(Number(match.homePoints));
    }
    if(match.visitorPoints){
      this.marcadorForm.controls.visitorScore.setValue(Number(match.visitorPoints));
    }
    this.isScouting = true;
    // Load the left (home) team by default so its players show under the match info.
    await this.selectScoutingTeam(match.homeTeam);
  }

  async selectScoutingTeam(team:MatchTeam){
    this.editingTeam = team as MatchTeamWithPhoto;
    await this.loadTeam(this.editingTeam.id);
  }

  submitScore(){
    let id = "";
    if(this.scoutingMatch.id){
      id = this.scoutingMatch.id;
    }
    let hs = "";
    if(this.marcadorForm.value.homeScore){
      hs = this.marcadorForm.value.homeScore.toString();
    }
    let vs = "";
    if(this.marcadorForm.value.visitorScore){
      vs = this.marcadorForm.value.visitorScore.toString();
    }
    this.matchBuilder.submit(this.ddb, id, hs, vs).then(
      (rs) => {
        this.loadMatches();
      }
    );
    // Keep the scores on the scouting page after saving (don't close the view).
    this.scoutingMatch.homePoints = hs;
    this.scoutingMatch.visitorPoints = vs;
  }

  closeScout(){
    this.isScouting = false;
    this.scoutingMatch = {location: {id: "", name: ""}, time: "", datetime: new Date(), juego: "", visitorTeam: {id: "", name: "", category: ""}, visitorPoints: "0", homeTeam: {id: "", name: "", category: ""}, homePoints:"0"};
    this.marcadorForm.reset();
    this.editingTeam = {id: "", name: "", category: "", imageUrl: ""};
    this.players = [];
    this.team = undefined;
  }

  async edit(team:MatchTeam){
    this.editingTeam = team as MatchTeamWithPhoto;

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

  team: Team | undefined;
  players: PlayerWithPhoto[] = [];
  async loadTeam(teamId: string){
    this.players = []
    this.team = await this.teamBuilder.getTeam(this.ddb, teamId);
    await this.getTeamImgAsBuffer(this.editingTeam)
    
    let teamPlayers = await this.playerBuilder.getPlayersByTeam(this.ddb, teamId);
    teamPlayers = teamPlayers.filter((p: Player) => p.year! === this.team!.year!);
    await teamPlayers.forEach(async element => {
      let p = element as PlayerWithPhoto
      if (p.imageType ){
        await this.getPlayerImgAsBuffer(p);
      }  else {
        p.imageUrl = "assets/no-avatar.png"
      }
      this.players.push(p)
    });
  }

  async getPlayerImgAsBuffer(player: PlayerWithPhoto){
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

  async getTeamImgAsBuffer(team: MatchTeamWithPhoto){
    // Team logos live under the team-logos/ prefix (same key as list-teams and
    // view-teams), not images/{id}. Using the logo path also shares the S3 cache.
    let data = await this.s3.downloadFile(TeamBuilder.getLogoFilePath(team.id))
    console.log("Downloaded data:", data);

    if (data) {
      let blob = new Blob([data], { type: team.imageType ?? "image/jpeg" });
        // display blob as img
      const reader2 = new FileReader();
      reader2.readAsDataURL(blob);
      reader2.onload = () => {
        team.imageUrl = reader2.result;
      };
    } else {
      console.error("No data returned from downloadFile");
      team.imageUrl = "assets/logo_gray.png";
    }
  }

  goBack(){
    this.isTeamSelected = false;
    this.marcadorForm.reset();
  }

}  
