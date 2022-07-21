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
  showResults: boolean = false;
  todayDay = new Date().getDate()

  constructor(private httpService: HttpClient) { }
  ngOnInit(): void {
    
    this.httpService.get(S3_BUCKET_URL(this.todayDay)).subscribe(
      (response) => {
        console.log('response received', response);
        this.matches = (response as any).matches as Match[];
        this.showResults = this.matches.length > 0;
        console.log("showResults", this.showResults)
      },
      (error) => {
        console.error(error)
        this.showResults = false
      }
    )
  }
}
