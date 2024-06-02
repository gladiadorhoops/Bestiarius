import { Component, QueryList, ViewChildren } from '@angular/core';
import { BracketsComponent } from '../results/brackets/brackets.component';
import { StandingMatchesComponent } from '../results/standing-matches/standing-matches.component';
import { GroupsComponent } from '../results/groups/groups.component';
import { AwardsComponent } from '../results/awards/awards.component';
import { CURRENT_YEAR } from '../aws-clients/constants';

@Component({
  selector: 'app-partidos',
  templateUrl: './partidos.component.html',
  styleUrls: ['./partidos.component.scss']
})
export class PartidosComponent {

  loading = false;
  TournmentEdition = Number(CURRENT_YEAR)-2012;

  showBrackets = false;
  showStandings = false;
  showGroups = false;
  showAwards = false;

  @ViewChildren(BracketsComponent) bracketChild!: QueryList<BracketsComponent>;
  @ViewChildren(StandingMatchesComponent) standingsChild!: QueryList<StandingMatchesComponent>;
  @ViewChildren(GroupsComponent) groupsChild!: QueryList<GroupsComponent>;
  @ViewChildren(AwardsComponent) awardsChild!: QueryList<AwardsComponent>;


  async ngOnInit() {
    console.log("init partidos");
    await this.loadResults();
  } 
  
  async loadResults(){
    this.loading = false;
    await this.showViews();
  }

  async showViews(){
    await this.bracketChild;
    await this.bracketChild.forEach(element => {
      element.loadMatches(CURRENT_YEAR);
    });
    await this.standingsChild;
    await this.standingsChild.forEach(element => {
      element.loadMatches(CURRENT_YEAR);
      return;
    });
    await this.groupsChild;
    await this.groupsChild.forEach(element => {
      element.loadMatches(CURRENT_YEAR);
      return;
    });
    await this.awardsChild;
    await this.awardsChild.forEach(element => {
      element.loadWinners(CURRENT_YEAR);
      return;
    });
  }
}
