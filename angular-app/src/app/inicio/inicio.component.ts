import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'
import { MatchBuilder } from '../Builders/match-builder';
import { TeamBuilder } from '../Builders/team-builder';
import { FeatureFlagBuilder } from '../Builders/feature-flag-builder';
import { Match } from '../interfaces/match';
import { MatchTeam } from '../interfaces/team';
import { DynamoDb } from '../aws-clients/dynamodb';
import { COGNITO_UNAUTHENTICATED_CREDENTIALS, REGION, TOURNAMENT_YEAR } from '../aws-clients/constants';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3, client as s3Client } from '../aws-clients/s3';
import { Feature } from '../enum/feature-flag';

interface PodioRow {
  pos: '#1' | '#2' | '#3';
  medal: 'gold' | 'silver' | 'bronze';
  team: string;
  logoUrl: string;
}

const LOGO_PLACEHOLDER = 'assets/logo_gray.png';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss']
})
export class InicioComponent implements OnInit, OnDestroy {

  ddbClient = new DynamoDBClient({
    region: REGION,
    credentials: COGNITO_UNAUTHENTICATED_CREDENTIALS,
  });
  ddb: DynamoDb = new DynamoDb(this.ddbClient);
  s3: S3 = new S3(s3Client);

  showButtons = false
  loadingPodio = true;
  podioYear = TOURNAMENT_YEAR;

  constructor(
    private httpService: HttpClient,
    public router: Router,
    private matchBuilder: MatchBuilder,
    private teamBuilder: TeamBuilder,
    private featureFlagBuilder: FeatureFlagBuilder,
  ) { }

  async ngOnInit() {
    await this.loadPodios();
  }

  ngOnDestroy(): void {
    this.s3.destroy();
  }

  resultsAP: PodioRow[] = this.emptyPodio();
  resultsEL: PodioRow[] = this.emptyPodio();

  private async loadPodios() {
    this.loadingPodio = true;

    const featureFlags = await this.featureFlagBuilder.getFeatureFlags(this.ddb);
    const showCurrentPodium = featureFlags ? featureFlags[Feature.SHOW_PODIUM] : true;
    this.podioYear = showCurrentPodium
      ? TOURNAMENT_YEAR
      : `${Math.max(0, Number(TOURNAMENT_YEAR) - 1)}`;

    const [matches, teamLogos] = await Promise.all([
      this.matchBuilder.getListOfMatch(this.ddb, this.podioYear),
      this.teamBuilder.loadAllTeamLogos(this.ddb, this.s3, this.podioYear),
    ]);

    this.resultsEL = this.buildPodioForCategory('elite', matches, teamLogos);
    this.resultsAP = this.buildPodioForCategory('aprendiz', matches, teamLogos);

    this.loadingPodio = false;
  }

  private emptyPodio(): PodioRow[] {
    return [
      { pos: '#1', medal: 'gold', team: '', logoUrl: '' },
      { pos: '#2', medal: 'silver', team: '', logoUrl: '' },
      { pos: '#3', medal: 'bronze', team: '', logoUrl: '' },
    ];
  }

  private buildPodioForCategory(
    category: 'elite' | 'aprendiz',
    matches: Match[],
    teamLogos: { [teamId: string]: string }
  ): PodioRow[] {
    const finalMatch = matches.find((m) => m.category === category && m.braketPlace === 'f15');
    const thirdPlaceMatch = matches.find((m) => m.category === category && m.braketPlace === 'f22');

    const { winner: finalWinner, loser: finalLoser } = this.getWinnerAndLoser(finalMatch);
    const { winner: thirdWinner } = this.getWinnerAndLoser(thirdPlaceMatch);

    return [
      this.toPodioRow('#1', finalWinner, teamLogos),
      this.toPodioRow('#2', finalLoser, teamLogos),
      this.toPodioRow('#3', thirdWinner, teamLogos),
    ];
  }

  private getWinnerAndLoser(match: Match | undefined): { winner?: MatchTeam; loser?: MatchTeam } {
    if (!match?.homeTeam || !match?.visitorTeam) {
      return {};
    }

    const homePoints = Number(match.homePoints ?? NaN);
    const visitorPoints = Number(match.visitorPoints ?? NaN);

    if (Number.isNaN(homePoints) || Number.isNaN(visitorPoints)) {
      return {};
    }

    // A 0-0 score means the match has not been played yet; keep podium slot blank.
    if (homePoints === 0 && visitorPoints === 0) {
      return {};
    }

    const homeIsWinner = homePoints >= visitorPoints;
    return {
      winner: homeIsWinner ? match.homeTeam : match.visitorTeam,
      loser: homeIsWinner ? match.visitorTeam : match.homeTeam,
    };
  }

  private toPodioRow(pos: '#1' | '#2' | '#3', team: MatchTeam | undefined, teamLogos: { [teamId: string]: string }): PodioRow {
    const medalByPosition: { [key in '#1' | '#2' | '#3']: 'gold' | 'silver' | 'bronze' } = {
      '#1': 'gold',
      '#2': 'silver',
      '#3': 'bronze',
    };

    if (!team?.id) {
      return { pos, medal: medalByPosition[pos], team: '', logoUrl: '' };
    }

    return {
      pos,
      medal: medalByPosition[pos],
      team: team.name,
      logoUrl: teamLogos[team.id] || LOGO_PLACEHOLDER,
    };
  }

}
