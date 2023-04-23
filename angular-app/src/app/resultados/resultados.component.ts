import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Ganadores } from '../interfaces/ganadores';

const S3_BUCKET_URL = `https://gladiadores-hoops.s3.amazonaws.com/match-data/tournament-10/ganadores.json`

@Component({
  selector: 'app-resultados',
  templateUrl: './resultados.component.html',
  styleUrls: ['./resultados.component.scss']
})
export class ResultadosComponent implements OnInit {
  ganadoresEquipos: Ganadores[] = [];
  ganadoresIndividuales: Ganadores[] = [];

  constructor(private httpService: HttpClient) { }
  ngOnInit(): void {
    this.httpService.get(S3_BUCKET_URL).subscribe(
      (response) => {
        console.log('response received', response);
        this.ganadoresEquipos = (response as any).equipos as Ganadores[];
        this.ganadoresIndividuales = (response as any).individuales as Ganadores[];
      },  
      (error) => {
        console.error(error)
      }  
    )  
  }

}
