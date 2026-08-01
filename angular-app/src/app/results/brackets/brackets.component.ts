import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../../interfaces/match';
import { MatchTeam } from '../../interfaces/team';
import { Gym } from '../../interfaces/gym';
import { FormBuilder } from '@angular/forms';
import { MatchBuilder } from '../../Builders/match-builder';
import { DynamoDb } from '../../aws-clients/dynamodb';
import { COGNITO_UNAUTHENTICATED_CREDENTIALS, TOURNAMENT_YEAR, REGION } from '../../aws-clients/constants'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// A bracket round and the braketPlace keys that belong to it. The same layout
// is shared by both the Aprendiz and Elite brackets, so the template just loops
// over this config instead of hardcoding every match.
interface BracketRound {
  title: string;
  cssClass: string;
  places: string[];
}

const LOGO_PLACEHOLDER = 'assets/logo_gray.png';

@Component({
  selector: 'app-brackets',
  templateUrl: './brackets.component.html',
  styleUrls: ['./brackets.component.scss']
})
export class BracketsComponent implements OnInit {
  ddbClient = new DynamoDBClient({
    region: REGION,
    credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS
  });
  ddb: DynamoDb =  new DynamoDb(this.ddbClient);

  allMatches: Match[] = [];
  loading = true;

  phases = ["Octavos", "Cuartos", "Semi-Finaless", "Finales"]

  rounds: BracketRound[] = [
    { title: 'Cuartos',     cssClass: 'quarterfinals', places: ['q9', 'q10', 'q11', 'q12'] },
    { title: 'Semifinales', cssClass: 'semifinals',    places: ['s13', 's14'] },
    { title: 'Tercer',      cssClass: 'bronze',        places: ['f22'] },
    { title: 'Final',       cssClass: 'gold',          places: ['f15'] },
  ];

  phaseMatches: {[place: string]: Match} = {}
  phaseMatchesElite: {[place: string]: Match} = {}
  showAprendiz: boolean = false;
  showElite: boolean = false;

  // Category to show, controlled by the shared toggle in the parent results
  // page. Only one category's bracket is shown at a time.
  @Input() category: 'elite' | 'aprendiz' = 'elite';

  // Shared object URL map populated once by the parent results page.
  @Input() teamLogos: {[teamId: string]: string} = {};
  // Id of the match whose gym/date/time detail is currently expanded.
  expandedMatchId: string | null = null;

  constructor(private fb: FormBuilder,
    private matchBuilder: MatchBuilder,
    private httpService: HttpClient
    ) {
  }

  selectedYear:string = "";

  async ngOnInit() {
    console.log("init brackets");
    await this.loadMatches(TOURNAMENT_YEAR);
  }

  async loadMatches(year: string){

    this.selectedYear = year;

    this.phaseMatches = {}
    this.phaseMatchesElite = {}

    this.allMatches = await this.matchBuilder.getListOfMatch(this.ddb, year)
    console.log("matches: ", this.allMatches)

    this.allMatches.forEach(element => {
      if(this.phases.includes(element.juego) && element.braketPlace != undefined){
        if(element.category == 'aprendiz'){
          this.phaseMatches[element.braketPlace] = element;
        }
        if(element.category == 'elite'){
          this.phaseMatchesElite[element.braketPlace] = element;
        }
      }
    });


    this.showAprendiz = Object.keys(this.phaseMatches).length != 0;
    this.showElite = Object.keys(this.phaseMatchesElite).length != 0;

    this.loading = false;

    console.log("loaded bracket")
  }

  teamLogoUrl(team: MatchTeam | undefined): string {
    return (team?.id && this.teamLogos[team.id]) || LOGO_PLACEHOLDER;
  }

  onLogoError(event: Event) {
    (event.target as HTMLImageElement).src = LOGO_PLACEHOLDER;
  }

  // First three letters of the team name, used as the compact bracket label.
  abbr(name: string | undefined): string {
    return (name ?? '').substring(0, 3);
  }

  mapsUrl(location: Gym | undefined): string {
    if (!location) { return ''; }
    return `https://www.google.com/maps/search/?api=1&query_place_id=${location.place_id}&query=${location.address}`;
  }

  toggleMatch(match: Match | undefined) {
    if (!match?.id) { return; }
    this.expandedMatchId = this.expandedMatchId === match.id ? null : match.id;
  }

  isExpanded(match: Match | undefined): boolean {
    return !!match?.id && this.expandedMatchId === match.id;
  }
}
