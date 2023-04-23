import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Match } from '../interfaces/match';

const S3_BUCKET_URL = (day: number) => `https://gladiadores-hoops.s3.amazonaws.com/match-data/tournament-10/category-matches-2022-07-${day}.json`


@Component({
  selector: 'app-marcadores',
  templateUrl: './marcadores.component.html',
  styleUrls: ['./marcadores.component.scss']
})  
export class MarcadoresComponent implements OnInit {

  matchesAprendiz: Match[] = [];
  matchesElite: Match[] = [];
  days: number[] = [29, 30, 31];
  matchesAprendizDays: Match[][] = [];
  matchesEliteDays: Match[][] = [];
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
    if(this.days[0] > this.todayDay || this.days[2] < this.todayDay) {
      display_date = this.days[0];
    }  

    this.httpService.get(S3_BUCKET_URL(day)).subscribe(
      (response) => {
        console.log('response received', response);
        this.matchesAprendizDays[day] = (response as any).matchesAprendiz as Match[];
        this.matchesEliteDays[day] = (response as any).matchesElite as Match[];
        
        if(day == display_date)
        {
          this.matchesAprendiz = this.matchesAprendizDays[day];
          this.matchesElite = this.matchesEliteDays[day];
          this.showResults = this.matchesAprendiz.length > 0 || this.matchesElite.length > 0;
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
    this.matchesAprendiz = this.matchesAprendizDays[day];
    this.matchesElite = this.matchesEliteDays[day];
    this.showResults = this.showResults || this.matchesAprendiz.length > 0;
  }  

}  
