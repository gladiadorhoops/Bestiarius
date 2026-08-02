import { Component, QueryList, ViewChildren } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { BracketsComponent } from '../results/brackets/brackets.component';
import { StandingMatchesComponent } from '../results/standing-matches/standing-matches.component';
import { GroupsComponent } from '../results/groups/groups.component';
import { AwardsComponent } from '../results/awards/awards.component';
import {
  COGNITO_UNAUTHENTICATED_CREDENTIALS,
  TOURNAMENT_YEAR,
  REGION,
  GROUP_NAMES,
  STANDING_GAME_NAME
} from '../aws-clients/constants';
import { FeatureFlag } from '../interfaces/feature-flag';
import { FeatureFlagBuilder } from '../Builders/feature-flag-builder';
import { TeamBuilder } from '../Builders/team-builder';
import { MatchBuilder } from '../Builders/match-builder';
import { DynamoDb } from '../aws-clients/dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3 } from '../aws-clients/s3';
import { S3Client } from '@aws-sdk/client-s3';
import { Match } from '../interfaces/match';
import { MatchTeam } from '../interfaces/team';
import { Gym } from '../interfaces/gym';
import { MatchFilters, EMPTY_MATCH_FILTERS } from '../interfaces/match-filters';
import { matchDateKey, toLocalDateTimeString } from '../utils/utils';

@Component({
  selector: 'app-partidos',
  templateUrl: './partidos.component.html',
  styleUrls: ['./partidos.component.scss']
})
export class PartidosComponent {

  constructor(
    private fb: FormBuilder,
    private featureFlagBuilder: FeatureFlagBuilder,
    private teamBuilder: TeamBuilder,
    private matchBuilder: MatchBuilder
  ){
  }

  loading = false;
  TournmentEdition = Number(TOURNAMENT_YEAR)-2012;
  ddbClient = new DynamoDBClient({ 
    region: REGION,
    credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS
  }); 
  ddb: DynamoDb =  new DynamoDb(this.ddbClient);
  s3: S3 = new S3(new S3Client({ region: REGION, credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS }));

  featureFlags: FeatureFlag | undefined = undefined
  teamLogos: {[teamId: string]: string} = {};
  
  showBrackets = false;
  showStandings = false;
  showGroups = false;
  showAwards = false;

  // Shared category filter for brackets, standings and groups. Only one
  // category is shown at a time; defaults to elite.
  categories = ["elite", "aprendiz"] as const;
  selectedCategory: 'elite' | 'aprendiz' = 'elite';

  // Extra filters for the Standings and Fase de Grupos sections. The brackets
  // and awards are unfiltered: a bracket only reads as a bracket whole.
  // Open on arrival: the date filter starts on today, so the bar has to be
  // visible for people to see why they aren't looking at every match.
  filtersCollapsed = false;
  selectedFilters: MatchFilters = EMPTY_MATCH_FILTERS;

  filterForm = this.fb.group({
    group: [null as string | null],
    teamId: [null as string | null],
    gymId: [null as string | null],
    day: [null as string | null]
  });

  // Dropdown options, derived from the matches the filtered sections actually
  // show so the lists never offer a choice that yields nothing. Rebuilt when the
  // category changes, since teams and groups don't span categories.
  groupOptions: string[] = [];
  teamOptions: MatchTeam[] = [];
  gymOptions: Gym[] = [];
  dayOptions: {key: string, label: string}[] = [];

  // Matches of the filtered sections (group phase + standings), all categories,
  // kept to build the dropdown options from.
  private filterableMatches: Match[] = [];

  @ViewChildren(BracketsComponent) bracketChild!: QueryList<BracketsComponent>;
  @ViewChildren(StandingMatchesComponent) standingsChild!: QueryList<StandingMatchesComponent>;
  @ViewChildren(GroupsComponent) groupsChild!: QueryList<GroupsComponent>;
  @ViewChildren(AwardsComponent) awardsChild!: QueryList<AwardsComponent>;


  async ngOnInit() {
    this.featureFlags = await this.featureFlagBuilder.getFeatureFlags(this.ddb);
    console.log("init partidos");
    await this.loadResults();
  } 
  
  async loadResults(){
    this.loading = false;
    this.teamLogos = {};
    void this.loadSharedTeamLogos();
    // After showViews(), which sets the flags loadFilterOptions() checks.
    await this.showViews();
    void this.loadFilterOptions();
  }

  private async loadSharedTeamLogos() {
    const loadedLogos = await this.teamBuilder.loadAllTeamLogos(this.ddb, this.s3, TOURNAMENT_YEAR);
    this.teamLogos = loadedLogos;
  }

  // The filtered sections each fetch their own matches; this is a separate read
  // used only to know which options to offer. It runs alongside them so the
  // results aren't held back by the filter bar.
  private async loadFilterOptions() {
    if (!this.showStandings && !this.showGroups) {
      return;
    }

    const allMatches = await this.matchBuilder.getListOfMatch(this.ddb, TOURNAMENT_YEAR);
    this.filterableMatches = allMatches.filter(
      match => GROUP_NAMES.includes(match.juego) || match.juego === STANDING_GAME_NAME
    );
    this.buildFilterOptions();
    // The day options only exist now, so this is the first point the date
    // default can be resolved.
    this.applyDefaultFilters();
  }

  // Options for the currently selected category only: a team or group from the
  // other category would filter every visible match away.
  private buildFilterOptions() {
    const matches = this.filterableMatches.filter(match => match.category === this.selectedCategory);

    this.groupOptions = GROUP_NAMES.filter(group => matches.some(match => match.juego === group));

    const teams = new Map<string, MatchTeam>();
    const gyms = new Map<string, Gym>();
    const days = new Map<string, string>();

    for (const match of matches) {
      for (const team of [match.homeTeam, match.visitorTeam]) {
        if (team?.id && !teams.has(team.id)) teams.set(team.id, team);
      }
      if (match.location?.id && !gyms.has(match.location.id)) gyms.set(match.location.id, match.location);

      const dayKey = matchDateKey(match);
      if (dayKey && !days.has(dayKey)) days.set(dayKey, this.formatDayLabel(match.datetime!));
    }

    this.teamOptions = [...teams.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    this.gymOptions = [...gyms.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
    // Keys are `YYYY-MM-DD`, so a plain string sort is chronological.
    this.dayOptions = [...days.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, label]) => ({key, label}));
  }

  // During the tournament the day being played is what people come to see, so
  // the date filter starts on it. Off-tournament there is no match today, and
  // defaulting to a day with nothing on it would look like an empty page — so
  // the filter stays open and every day is shown.
  private defaultDayKey(): string | null {
    const todayKey = toLocalDateTimeString(new Date()).split('T')[0];
    return this.dayOptions.some(day => day.key === todayKey) ? todayKey : null;
  }

  private applyDefaultFilters() {
    this.filterForm.reset({
      group: null,
      teamId: null,
      gymId: null,
      day: this.defaultDayKey()
    });
    this.applyFilters();
  }

  private formatDayLabel(datetime: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    }).format(datetime);
  }

  toggleFilters() {
    this.filtersCollapsed = !this.filtersCollapsed;
  }

  // A new object each time: the filtered sections receive it as an @Input() and
  // detect the change by identity.
  applyFilters() {
    this.selectedFilters = {
      group: this.filterForm.value.group || null,
      teamId: this.filterForm.value.teamId || null,
      gymId: this.filterForm.value.gymId || null,
      day: this.filterForm.value.day || null
    };
  }

  clearFilters() {
    this.filterForm.reset();
    this.applyFilters();
  }

  get hasActiveFilters(): boolean {
    const {group, teamId, gymId, day} = this.selectedFilters;
    return !!(group || teamId || gymId || day);
  }

  selectCategory(category: 'elite' | 'aprendiz'){
    if (this.selectedCategory === category) {
      return;
    }
    this.selectedCategory = category;
    // Groups and teams are per-category, so a selection made in the other one
    // would hide everything. Back to just the date default.
    this.buildFilterOptions();
    this.applyDefaultFilters();
  }

  async showViews(){
    this.showAwards = this.featureFlags ? this.featureFlags.showAwards : false;
    this.showBrackets = this.featureFlags ? this.featureFlags.showBrackets : false;
    this.showGroups = this.featureFlags ? this.featureFlags.showGroups : false;
    this.showStandings = this.featureFlags ? this.featureFlags.showStandings : false;

    if(this.showAwards){
      await this.awardsChild;
      await this.awardsChild.forEach(element => {
        element.loadWinners(TOURNAMENT_YEAR);
        return;
      });
    }

    if(this.showGroups){
      await this.groupsChild;
      await this.groupsChild.forEach(element => {
        element.loadMatches(TOURNAMENT_YEAR);
        return;
      });
    }

    if(this.showBrackets){
      await this.bracketChild;
      await this.bracketChild.forEach(element => {
        element.loadMatches(TOURNAMENT_YEAR);
      });
    }

    if(this.showStandings){
      await this.standingsChild;
      await this.standingsChild.forEach(element => {
        element.loadMatches(TOURNAMENT_YEAR);
        return;
      });
    }
  }
}
