import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../../interfaces/match';
import { FormBuilder } from '@angular/forms';
import { MatchBuilder } from '../../Builders/match-builder';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { COGNITO_UNAUTHENTICATED_CREDENTIALS, TOURNAMENT_YEAR, REGION, STANDING_GAME_NAME } from '../../aws-clients/constants'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { MatchTeam } from 'src/app/interfaces/team';
import { MatchFilters, EMPTY_MATCH_FILTERS } from 'src/app/interfaces/match-filters';
import { applyMatchFilters } from 'src/app/utils/utils';

const LOGO_PLACEHOLDER = 'assets/logo_gray.png';

@Component({
  selector: 'app-standing-matches',
  templateUrl: './standing-matches.component.html',
  styleUrls: ['./standing-matches.component.scss']
})
export class StandingMatchesComponent implements OnInit, OnChanges {
  ddbClient = new DynamoDBClient({ 
    region: REGION,
    credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS
  }); 
  ddb: DynamoDb =  new DynamoDb(this.ddbClient);

  allMatches: Match[] = [];
  loading = true;


  // Every standing match of each category, as loaded.
  standingMatches: Match[] = []
  standingMatchesElite: Match[] = []

  // What the template renders: the selected category's matches with the parent's
  // filters applied. Kept in sync by applyFilters().
  visibleMatches: Match[] = []

  // Category to show, controlled by the shared toggle in the parent results page.
  @Input() category: 'elite' | 'aprendiz' = 'elite';
  @Input() teamLogos: {[teamId: string]: string} = {};
  // Team/gym/date filters from the parent page. Grupo is intentionally not
  // applied: standing matches belong to no group, so it would empty the list.
  @Input() filters: MatchFilters = EMPTY_MATCH_FILTERS;
  @Output() matchesAvailable = new EventEmitter<boolean>();

  constructor(private fb: FormBuilder, 
    private matchBuilder: MatchBuilder,
    private httpService: HttpClient
    ) {
  }

  selectedYear:string = "";

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

    this.standingMatches = []
    this.standingMatchesElite = []

    this.allMatches = await this.matchBuilder.getListOfMatch(this.ddb, year)
    this.allMatches = this.allMatches.sort((a, b) => (a.day! + a.time!).localeCompare(b.day! + b.time!))
    this.allMatches.forEach(element => {
      if(element.juego == STANDING_GAME_NAME){
        if(element.category == "elite"){
          this.standingMatchesElite.push(element);
        }
        else{
          this.standingMatches.push(element);
        }
      }
    });
    this.loading = false;
    this.applyFilters();
  }

  // Recomputed on change rather than exposed as a getter: a getter would hand
  // *ngFor a new array every change-detection pass and re-render the cards.
  private applyFilters() {
    const categoryMatches = this.category === 'elite' ? this.standingMatchesElite : this.standingMatches;
    this.visibleMatches = applyMatchFilters(categoryMatches, this.filters, {includeGroup: false});
    this.emitMatchesAvailability();
  }

  get hasVisibleMatches(): boolean {
    return this.visibleMatches.length > 0;
  }

  // Whether the category has any standing matches before filtering. The section
  // stays hidden when it has none at all, but keeps rendering (with an empty
  // state) when it's the filters that emptied it — otherwise the section would
  // vanish and the filters would look broken.
  get hasCategoryMatches(): boolean {
    return this.category === 'elite'
      ? this.standingMatchesElite.length > 0
      : this.standingMatches.length > 0;
  }

  private emitMatchesAvailability() {
    this.matchesAvailable.emit(this.hasVisibleMatches);
  }

  teamLogoUrl(team: MatchTeam | undefined): string {
    return (team?.id && this.teamLogos[team.id]) || LOGO_PLACEHOLDER;
  }

  onLogoError(event: Event) {
    (event.target as HTMLImageElement).src = LOGO_PLACEHOLDER;
  }

}  
