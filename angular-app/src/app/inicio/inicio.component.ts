import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../interfaces/match';

const S3_BUCKET_URL = (day: number) => `https://gladiadores-hoops.s3.amazonaws.com/match-data/tournament-10/matches-2022-07-${day}.json`

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {

  matches: Match[] = [];
  days: number[] = [29, 30, 31];
  matchesDays: Match[][] = [];
  showResults: boolean = false;
  todayDay = new Date().getDate()

  constructor(private httpService: HttpClient) { }
  ngOnInit(): void {
    
    this.loadMatchesPerDay(this.days[0]);
    this.loadMatchesPerDay(this.days[1]);
    this.loadMatchesPerDay(this.days[2]);
  }

  loadMatchesPerDay(day: number) {
    let display_date = this.todayDay;
    if(this.days[0] > this.todayDay) {
      display_date = this.days[0];
    }

    this.httpService.get(S3_BUCKET_URL(day)).subscribe(
      (response) => {
        console.log('response received', response);
        this.matchesDays[day] = (response as any).matches as Match[];
        
        if(day == display_date)
        {
          this.matches = this.matchesDays[day];
          this.showResults = this.matches.length > 0;
          console.log("showResults", this.showResults)
        }
      },
      (error) => {
        console.error(error)
        if(day == display_date)
        {
          this.showResults = false;
        }
      }
    )
  }

  showDay(day: number) {
    this.matches = this.matchesDays[day];
    this.showResults = this.matches.length > 0;
  }
}
