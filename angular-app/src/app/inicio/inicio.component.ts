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
    {pos: "#1", team: "ALUTEC"},
    {pos: "#2", team: "Pioneros de Delicias"},
    {pos: "#3", team: "Esbal"}
  ]

  resultsEL = [
    {pos: "#1", team: "Juarez"},
    {pos: "#2", team: "SAHQ Academy"},
    {pos: "#3", team: "Wildcats Torreon"}
  ]

}
