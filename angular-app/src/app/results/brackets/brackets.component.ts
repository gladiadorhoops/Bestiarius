import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, OnInit, QueryList, SimpleChanges, ViewChildren } from '@angular/core';
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
export class BracketsComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
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

  @ViewChildren('bracketLayout') bracketLayouts!: QueryList<ElementRef<HTMLElement>>;

  private alignmentFrameId: number | null = null;
  private readonly onResize = () => this.scheduleAlignment();
  private readonly finalBaseSpacingPx = 24;

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

  ngAfterViewInit() {
    window.addEventListener('resize', this.onResize);
    this.bracketLayouts.changes.subscribe(() => this.scheduleAlignment());
    this.scheduleAlignment();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['category']) {
      this.scheduleAlignment();
    }
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.onResize);
    if (this.alignmentFrameId !== null) {
      cancelAnimationFrame(this.alignmentFrameId);
      this.alignmentFrameId = null;
    }
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
    this.scheduleAlignment();

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

  visibleRounds(matches: Record<string, Match | undefined>): BracketRound[] {
    return this.rounds.filter(round => round.places.some(place => !!matches[place]));
  }

  hasQuarterfinalMatches(matches: Record<string, Match | undefined>): boolean {
    return ['q9', 'q10', 'q11', 'q12'].some(place => !!matches[place]);
  }

  getQuarterfinalMatches(matches: Record<string, Match | undefined>): Array<Match | undefined> {
    return ['q9', 'q10', 'q11', 'q12'].map(place => matches[place]);
  }

  getSemifinalMatches(matches: Record<string, Match | undefined>): Array<Match | undefined> {
    return ['s13', 's14'].map(place => matches[place]);
  }

  getFinalMatch(matches: Record<string, Match | undefined>): Match | undefined {
    return matches['f15'];
  }

  getThirdPlaceMatch(matches: Record<string, Match | undefined>): Match | undefined {
    return matches['f22'];
  }

  mapsUrl(location: Gym | undefined): string {
    if (!location) { return ''; }
    return `https://www.google.com/maps/search/?api=1&query_place_id=${location.place_id}&query=${location.address}`;
  }

  toggleMatch(match: Match | undefined) {
    if (!match?.id) { return; }
    this.expandedMatchId = this.expandedMatchId === match.id ? null : match.id;
    this.scheduleAlignment();
  }

  isExpanded(match: Match | undefined): boolean {
    return !!match?.id && this.expandedMatchId === match.id;
  }

  private scheduleAlignment() {
    if (this.alignmentFrameId !== null) {
      cancelAnimationFrame(this.alignmentFrameId);
    }

    this.alignmentFrameId = requestAnimationFrame(() => {
      this.alignmentFrameId = null;
      this.applyDynamicAlignment();
    });
  }

  private applyDynamicAlignment() {
    if (!this.bracketLayouts?.length) { return; }

    this.bracketLayouts.forEach(layoutRef => {
      const layout = layoutRef.nativeElement;
      this.resetDynamicStyles(layout);

      const quarterSlots = Array.from(layout.querySelectorAll<HTMLElement>('.tournament-bracket__slot--quarter'));
      const semifinalFirst = layout.querySelector<HTMLElement>('.tournament-bracket__slot--semifinal-first');
      const semifinalSecond = layout.querySelector<HTMLElement>('.tournament-bracket__slot--semifinal-second');
      const finalSlot = layout.querySelector<HTMLElement>('.tournament-bracket__slot--final');

      if (quarterSlots.length >= 4 && semifinalFirst && semifinalSecond) {
        this.alignSlotToPairMidpoint(semifinalFirst, quarterSlots[0], quarterSlots[1]);
        this.alignSlotToPairMidpoint(semifinalSecond, quarterSlots[2], quarterSlots[3]);

        const semifinalConnectorFirst = semifinalFirst.querySelector<HTMLElement>('.tournament-bracket__connector--quarter');
        const semifinalConnectorSecond = semifinalSecond.querySelector<HTMLElement>('.tournament-bracket__connector--quarter');
        if (semifinalConnectorFirst) {
          semifinalConnectorFirst.style.height = `${this.centerDistance(quarterSlots[0], quarterSlots[1])}px`;
        }
        if (semifinalConnectorSecond) {
          semifinalConnectorSecond.style.height = `${this.centerDistance(quarterSlots[2], quarterSlots[3])}px`;
        }
      }

      if (finalSlot && semifinalFirst && semifinalSecond) {
        const finalDelta = this.alignSlotToPairMidpoint(finalSlot, semifinalFirst, semifinalSecond);

        // Keep flow spacing in sync with visual translateY so Final never overlaps Tercer.
        const extraSpace = Math.max(0, finalDelta);
        finalSlot.style.marginBottom = `${this.finalBaseSpacingPx + extraSpace}px`;

        const finalConnector = finalSlot.querySelector<HTMLElement>('.tournament-bracket__connector--final');
        if (finalConnector) {
          finalConnector.style.height = `${this.centerDistance(semifinalFirst, semifinalSecond)}px`;
        }
      }
    });
  }

  private resetDynamicStyles(layout: HTMLElement) {
    const dynamicSlots = layout.querySelectorAll<HTMLElement>(
      '.tournament-bracket__slot--semifinal-first, .tournament-bracket__slot--semifinal-second, .tournament-bracket__slot--final'
    );

    dynamicSlots.forEach(slot => {
      slot.style.transform = '';
      if (slot.classList.contains('tournament-bracket__slot--final')) {
        slot.style.marginBottom = '';
      }
    });

    const dynamicConnectors = layout.querySelectorAll<HTMLElement>(
      '.tournament-bracket__connector--quarter, .tournament-bracket__connector--final'
    );

    dynamicConnectors.forEach(connector => {
      connector.style.height = '';
    });
  }

  private alignSlotToPairMidpoint(target: HTMLElement, sourceA: HTMLElement, sourceB: HTMLElement): number {
    const currentCenter = this.elementCenterY(target);
    const desiredCenter = (this.elementCenterY(sourceA) + this.elementCenterY(sourceB)) / 2;
    const delta = desiredCenter - currentCenter;
    target.style.transform = `translateY(${delta}px)`;
    return delta;
  }

  private centerDistance(a: HTMLElement, b: HTMLElement): number {
    return Math.abs(this.elementCenterY(a) - this.elementCenterY(b));
  }

  private elementCenterY(element: HTMLElement): number {
    const rect = element.getBoundingClientRect();
    return rect.top + rect.height / 2;
  }
}
