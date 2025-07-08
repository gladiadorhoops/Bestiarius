import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-torneo',
  templateUrl: './torneo.component.html',
  styleUrls: ['./torneo.component.scss']
})
export class TorneoComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  count = new Date().getFullYear()-2013;

}
