import { Component, QueryList, ViewChildren } from '@angular/core';
import { FormGroup, FormControl } from "@angular/forms";
import { BracketsComponent } from './brackets/brackets.component';
import { StandingMatchesComponent } from './standing-matches/standing-matches.component';
import { GroupsComponent } from './groups/groups.component';
import { AwardsComponent } from './awards/awards.component';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent {

  selectedYear = "";
  selectedOption = "";

  TournmentEdition = 0;

  years = ["2025", "2024", "2023", "2022"]

  // Shared category filter for all results sections (brackets, standings,
  // groups). Only one category is shown at a time; defaults to elite.
  categories = ["elite", "aprendiz"]
  selectedCategory: 'elite' | 'aprendiz' = 'elite';


  @ViewChildren(BracketsComponent) bracketChild!: QueryList<BracketsComponent>;
  @ViewChildren(StandingMatchesComponent) standingsChild!: QueryList<StandingMatchesComponent>;
  @ViewChildren(GroupsComponent) groupsChild!: QueryList<GroupsComponent>;
  @ViewChildren(AwardsComponent) awardsChild!: QueryList<AwardsComponent>;

  year = new FormControl((new Date().getFullYear()-1).toString());
  category = new FormControl<'elite' | 'aprendiz'>('elite');


  async ngOnInit() {
    console.log("init results");
    await this.loadResults();
  }

  async loadResults(){
    this.selectedYear = this.year.value!;
    this.TournmentEdition = Number(this.selectedYear) - 2012;
    console.log("year", this.selectedYear);
    if(this.selectedYear != "2022"){
      await this.showViews();
    }
  }

  selectCategory(){
    this.selectedCategory = this.category.value!;
  }

  async showViews(){
    await this.bracketChild;
    await this.bracketChild.forEach(element => {
      element.loadMatches(this.selectedYear);
    });
    await this.standingsChild;
    await this.standingsChild.forEach(element => {
      element.loadMatches(this.selectedYear);
      return;
    });
    await this.groupsChild;
    await this.groupsChild.forEach(element => {
      element.loadMatches(this.selectedYear);
      return;
    });
    await this.awardsChild;
    await this.awardsChild.forEach(element => {
      element.loadWinners(this.selectedYear);
      return;
    });
  }
}
