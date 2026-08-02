import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Match } from '../../interfaces/match';
import { Category, MatchTeam } from '../../interfaces/team';
import { MatchBuilder } from '../../Builders/match-builder';
import { StandingBuilder } from '../../Builders/standing-builder';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { S3 } from '../../aws-clients/s3';
import { GroupStanding } from '../../interfaces/standing';
import { COGNITO_UNAUTHENTICATED_CREDENTIALS, TOURNAMENT_YEAR, REGION, GROUP_NAMES } from '../../aws-clients/constants'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';

// One result as seen from the row team's point of view: "G 44 - 38" means the
// row team won 44 to 38. Cells stay undefined when the pairing hasn't been
// played yet, which is what leaves the blanks in the table.
export interface StandingsCell {
  outcome: 'G' | 'P' | 'E';
  teamPoints: number;
  opponentPoints: number;
}

// A group's cross table. `teams` are the columns (always the whole group, so a
// team's results stay readable against every opponent) and `rowTeams` are the
// rows — the same list, unless the team filter narrows it to one. `results` is
// indexed [rowTeamId][columnTeamId].
export interface GroupStandings {
  group: string;
  teams: MatchTeam[];
  rowTeams: MatchTeam[];
  results: {[rowTeamId: string]: {[columnTeamId: string]: StandingsCell | undefined}};
}

@Component({
  selector: 'app-standings',
  templateUrl: './standings.component.html',
  styleUrls: ['./standings.component.scss']
})

export class StandingsComponent implements OnInit {
  ddbClient = new DynamoDBClient({
    region: REGION,
    credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS
  });
  ddb: DynamoDb = new DynamoDb(this.ddbClient);
  s3: S3 = new S3(new S3Client({
    region: REGION,
    credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS
  }));

  loading = true;

  // Same group names (and order) the group-phase match list uses.
  groups = GROUP_NAMES

  // Elite first, matching the filter on the partidos page. (Listed explicitly
  // rather than via getCategories(), which returns aprendiz first.)
  categories: Category[] = [Category.ELITE, Category.APRENDIZ];
  selectedCategory: Category = Category.ELITE;
  category = new FormControl<Category>(Category.ELITE);

  // Built cross tables per category, so switching the filter doesn't refetch.
  standingsByCategory: Partial<Record<Category, GroupStandings[]>> = {};

  // Every team playing the group phase in each category, for the team filter.
  teamsByCategory: Partial<Record<Category, MatchTeam[]>> = {};

  // Empty means "all teams"; otherwise the id of the team to narrow down to.
  selectedTeamId = "";
  team = new FormControl<string>("");

  // What the template renders: the selected category's tables with the team
  // filter applied. Kept in sync by applyFilters().
  standings: GroupStandings[] = [];

  // Position tables published to S3 by the Retiarius CreateStandings workflow,
  // grouped by category. Shown below the cross tables.
  groupStandingsByCategory: Partial<Record<Category, GroupStanding[]>> = {};

  // The selected category's position tables, with the team filter applied.
  groupStandings: GroupStanding[] = [];

  selectedYear = "";

  constructor(
    private matchBuilder: MatchBuilder,
    private standingBuilder: StandingBuilder
  ) {
  }

  async ngOnInit() {
    await this.loadMatches(TOURNAMENT_YEAR);
  }

  selectCategory() {
    this.selectedCategory = this.category.value!;
    // The team lists don't overlap between categories, so a team picked in the
    // old one would filter everything away. Back to "all teams".
    this.clearTeam();
  }

  selectTeam() {
    this.selectedTeamId = this.team.value ?? "";
    this.applyFilters();
    this.applyStandingsFilters();
  }

  clearTeam() {
    this.selectedTeamId = "";
    this.team.setValue("");
    this.applyFilters();
    this.applyStandingsFilters();
  }

  // Teams of the selected category, for the team dropdown.
  get teams(): MatchTeam[] {
    return this.teamsByCategory[this.selectedCategory] ?? [];
  }

  // Recomputed only when a filter changes, rather than exposed as a getter: the
  // team filter builds new GroupStandings objects, and a getter would hand
  // *ngFor a different object every change-detection pass and rebuild the tables.
  private applyFilters() {
    const standings = this.standingsByCategory[this.selectedCategory] ?? [];

    if (!this.selectedTeamId) {
      this.standings = standings;
      return;
    }

    // Only the selected team's group is shown, and only its row within it. The
    // columns stay the whole group so the row still reads as "us against each
    // opponent".
    this.standings = standings
      .filter(groupStandings => groupStandings.teams.some(team => team.id === this.selectedTeamId))
      .map(groupStandings => ({
        ...groupStandings,
        rowTeams: groupStandings.teams.filter(team => team.id === this.selectedTeamId)
      }));
  }

  // Same shape as applyFilters(), for the position tables. Unlike the cross
  // table, the team filter keeps every row of the group: a position only means
  // something next to the teams it's measured against. The team's own row is
  // highlighted instead.
  private applyStandingsFilters() {
    const groupStandings = this.groupStandingsByCategory[this.selectedCategory] ?? [];

    if (!this.selectedTeamId) {
      this.groupStandings = groupStandings;
      return;
    }

    this.groupStandings = groupStandings
      .filter(group => group.standings.some(row => row.teamId === this.selectedTeamId));
  }

  async loadMatches(year: string) {
    this.loading = true;
    this.selectedYear = year;
    this.standingsByCategory = {};
    this.teamsByCategory = {};
    this.groupStandingsByCategory = {};
    this.clearTeam();

    const [allMatches, publishedStandings] = await Promise.all([
      this.matchBuilder.getListOfMatch(this.ddb, year),
      this.standingBuilder.getStandings(this.s3)
    ]);

    const groupMatches = allMatches.filter(match => this.groups.includes(match.juego));

    this.categories.forEach(category => {
      const standings = this.buildStandings(
        groupMatches.filter(match => match.category === category)
      );
      this.standingsByCategory[category] = standings;
      this.teamsByCategory[category] = this.collectFilterTeams(standings);
      this.groupStandingsByCategory[category] = this.orderGroupStandings(
        publishedStandings.filter(group => group.category === category)
      );
    });

    // clearTeam() above ran before the tables existed, so pick them up now.
    this.applyFilters();
    this.applyStandingsFilters();

    this.loading = false;
  }

  // The file lists groups in whatever order the workflow emitted them; line them
  // up with the cross tables above. Groups the workflow named but this page
  // doesn't know about go last, in file order.
  private orderGroupStandings(groupStandings: GroupStanding[]): GroupStanding[] {
    return [...groupStandings].sort((a, b) => {
      const aIndex = this.groups.indexOf(a.group);
      const bIndex = this.groups.indexOf(b.group);
      return (aIndex < 0 ? this.groups.length : aIndex) - (bIndex < 0 ? this.groups.length : bIndex);
    });
  }

  // Flattens the per-group team lists into one alphabetical list for the team
  // dropdown. A team only ever belongs to one group, so there's nothing to dedupe.
  private collectFilterTeams(standings: GroupStandings[]): MatchTeam[] {
    return standings
      .flatMap(groupStandings => groupStandings.teams)
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  // Turns a flat match list into one cross table per group. Groups with no
  // matches are dropped so the page only renders what actually exists.
  private buildStandings(matches: Match[]): GroupStandings[] {
    return this.groups
      .map(group => this.buildGroupStandings(group, matches.filter(match => match.juego === group)))
      .filter(standings => standings.teams.length > 0);
  }

  private buildGroupStandings(group: string, matches: Match[]): GroupStandings {
    const teams = new Map<string, MatchTeam>();
    const results: GroupStandings['results'] = {};

    for (const match of matches) {
      // A single-team entry is a bye — it has no opponent to score against.
      if (match.singleTeam) {
        this.collectTeam(teams, results, match.homeTeam);
        continue;
      }

      this.collectTeam(teams, results, match.homeTeam);
      this.collectTeam(teams, results, match.visitorTeam);

      const homePoints = Number(match.homePoints ?? 0);
      const visitorPoints = Number(match.visitorPoints ?? 0);

      // 0-0 is the score a match is created with, so treat it as "not played
      // yet" and leave the pair of cells blank.
      if (!homePoints && !visitorPoints) {
        continue;
      }

      results[match.homeTeam.id][match.visitorTeam.id] = this.buildCell(homePoints, visitorPoints);
      results[match.visitorTeam.id][match.homeTeam.id] = this.buildCell(visitorPoints, homePoints);
    }

    const sortedTeams = [...teams.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));

    // Unfiltered, every team is also a row; the team filter narrows this down.
    return {
      group,
      teams: sortedTeams,
      rowTeams: sortedTeams,
      results
    };
  }

  private collectTeam(
    teams: Map<string, MatchTeam>,
    results: GroupStandings['results'],
    team: MatchTeam | undefined
  ) {
    if (!team?.id) return;
    if (!teams.has(team.id)) {
      teams.set(team.id, team);
      results[team.id] = {};
    }
  }

  private buildCell(teamPoints: number, opponentPoints: number): StandingsCell {
    let outcome: StandingsCell['outcome'] = 'E';
    if (teamPoints > opponentPoints) outcome = 'G';
    if (teamPoints < opponentPoints) outcome = 'P';
    return { outcome, teamPoints, opponentPoints };
  }
}
