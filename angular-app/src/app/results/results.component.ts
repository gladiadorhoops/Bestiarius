import { Component, QueryList, ViewChildren } from '@angular/core';
import { FormGroup, FormControl } from "@angular/forms";
import { BracketsComponent } from './brackets/brackets.component';
import { StandingMatchesComponent } from './standing-matches/standing-matches.component';
import { GroupsComponent } from './groups/groups.component';

@Component({
  selector: 'app-results',
  templateUrl: './results.component.html',
  styleUrls: ['./results.component.scss']
})
export class ResultsComponent {

  selectedYear = "";
  selectedOption = "";

  years = ["2024", "2023", "2022"]
  options : string[] = []
  options_new = ["brackets","standings","grupos"]
  options_old = ["resultados","marcadores"]


  @ViewChildren(BracketsComponent) bracketChild!: QueryList<BracketsComponent>;
  @ViewChildren(StandingMatchesComponent) standingsChild!: QueryList<StandingMatchesComponent>;
  @ViewChildren(GroupsComponent) groupsChild!: QueryList<GroupsComponent>;

  year = new FormControl("2023");
  option = new FormControl();
  

  async ngOnInit() {
    await this.loadResults();
  } 
  
  async loadResults(){
    this.selectedYear = this.year.value!;
    console.log("year", this.selectedYear);
    if(this.selectedYear === "2022"){
      this.options = this.options_old;
    }
    else{
      this.options = this.options_new;
    }

    this.option.setValue(this.options[0]);
    await this.showViews();
  }

  async showViews(){
    this.selectedOption = this.option.value!;
    console.log("option", this.selectedOption);

    if(this.selectedOption === "brackets"){
      await this.bracketChild.forEach(element => {
        element.loadMatches(this.selectedYear);
      });
    }
    if(this.selectedOption === "standings"){
      await this.standingsChild.forEach(element => {
        element.loadMatches(this.selectedYear);
        return;
      });
    }
    if(this.selectedOption === "grupos"){
      await this.groupsChild.forEach(element => {
        element.loadMatches(this.selectedYear);
        return;
      });
    }
  }
}
