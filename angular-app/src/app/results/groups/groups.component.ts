import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../../interfaces/match';
import { FormBuilder } from '@angular/forms';
import { MatchBuilder } from '../../Builders/match-builder';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { COGNITO_UNAUTHENTICATED_CREDENTIALS, TOURNAMENT_YEAR, REGION, GROUP_NAMES } from '../../aws-clients/constants'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { MatchTeam } from 'src/app/interfaces/team';
import { MatchFilters, EMPTY_MATCH_FILTERS } from 'src/app/interfaces/match-filters';
import { applyMatchFilters } from 'src/app/utils/utils';



const LOGO_PLACEHOLDER = 'assets/logo_gray.png';

@Component({
  selector: 'app-groups',
  templateUrl: './groups.component.html',
  styleUrls: ['./groups.component.scss']
})
export class GroupsComponent implements OnInit, OnChanges {
  ddbClient = new DynamoDBClient({ 
    region: REGION,
    credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS
  }); 
  ddb: DynamoDb =  new DynamoDb(this.ddbClient);

  allMatches: Match[] = [];
  loading = true;

  isEditing: boolean = false;
  groups = GROUP_NAMES

  groupMatches: {[group: string]: Match[]} = {}
  groupMatchesElite: {[group: string]: Match[]} = {}

  // What the template renders: the selected category's groups with the parent's
  // filters applied, and only the groups that still have matches. Kept in sync
  // by applyFilters().
  visibleGroups: {group: string, matches: Match[]}[] = []

  // Category to show, controlled by the shared toggle in the parent results page.
  @Input() category: 'elite' | 'aprendiz' = 'elite';
  @Input() teamLogos: {[teamId: string]: string} = {};
  // Group/team/gym/date filters from the parent page.
  @Input() filters: MatchFilters = EMPTY_MATCH_FILTERS;

  constructor(private fb: FormBuilder, 
    private matchBuilder: MatchBuilder,
    private httpService: HttpClient
    ) {
  }
  selectedYear = "";

  async ngOnInit() {
    await this.loadMatches(TOURNAMENT_YEAR)
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['category'] || changes['filters']) {
      this.applyFilters();
    }
  }

  async loadMatches(year: string){

    this.selectedYear = year;

    this.groupMatches = {}
    this.groupMatchesElite = {}

    this.groups.forEach(element => {
      this.groupMatches[element] = [];
      this.groupMatchesElite[element] = [];
    });

    this.allMatches = await this.matchBuilder.getListOfMatch(this.ddb, this.selectedYear)
    this.allMatches = this.allMatches.sort((a, b) => (a.datetime!.toISOString().localeCompare(b.datetime!.toISOString())))
    
    this.allMatches.forEach(element => {
      if(this.groups.includes(element.juego)){
        if(element.category == "elite"){
          this.groupMatchesElite[element.juego].push(element);
        }
        else{
          this.groupMatches[element.juego].push(element);
        }
      }
    });
    this.loading = false;
    this.applyFilters();
  }

  // Recomputed on change rather than exposed as a getter: a getter would hand
  // *ngFor new objects every change-detection pass and re-render every card.
  private applyFilters() {
    const categoryMatches = this.category === 'elite' ? this.groupMatchesElite : this.groupMatches;

    this.visibleGroups = this.groups
      .map(group => ({
        group,
        matches: applyMatchFilters(categoryMatches[group] ?? [], this.filters)
      }))
      .filter(entry => entry.matches.length > 0);
  }

  // Whether the category has any group match before filtering, to tell "nothing
  // published yet" apart from "the filters matched nothing".
  get hasCategoryMatches(): boolean {
    const categoryMatches = this.category === 'elite' ? this.groupMatchesElite : this.groupMatches;
    return Object.values(categoryMatches).some(matches => matches.length > 0);
  }

  teamLogoUrl(team: MatchTeam | undefined): string {
    return (team?.id && this.teamLogos[team.id]) || LOGO_PLACEHOLDER;
  }

  onLogoError(event: Event) {
    (event.target as HTMLImageElement).src = LOGO_PLACEHOLDER;
  }


}  
