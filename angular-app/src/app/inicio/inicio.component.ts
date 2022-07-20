import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import data from '../../assets/results.json';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css']
})
export class InicioComponent implements OnInit {

  matches: Array<any> = [];
  showResults: boolean = true;

  constructor(private httpService: HttpClient) { }
  ngOnInit(): void {
    //*
    this.matches= data.matches;
    this.showResults = this.matches.length > 1;
  }

}
