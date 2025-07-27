import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'


@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.scss']
})
export class InicioComponent implements OnInit {

  constructor(private httpService: HttpClient, public router: Router) { }
  ngOnInit(): void {
  }

  resultsAP = [
    {pos: "#1", team: "Tigres"},
    {pos: "#2", team: "Chihuahua U-15"},
    {pos: "#3", team: "Jaguares Saltillo"}
  ]

  resultsEL = [
    {pos: "#1", team: "SAHQ Academy"},
    {pos: "#2", team: "Wildcats Torreon"},
    {pos: "#3", team: "Dragones"}
  ]

}
