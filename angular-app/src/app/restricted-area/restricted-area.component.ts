import { Component, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { DynamoDb } from '../aws-clients/dynamodb';
import { ViewTeamsComponent } from './view-teams/view-teams.component';
import { ListTeamsComponent } from './list-teams/list-teams.component';

export interface MenuItem {
  text: string
  value: string
}

@Component({
  selector: 'app-restricted-area',
  templateUrl: './restricted-area.component.html',
  styleUrls: ['./restricted-area.component.scss']
})
export class RestrictedAreaComponent {
    form:FormGroup;
    isLoggedIn: boolean = false;
    isAdmin = false;
    isScout = false;
    isCoach = false;
    userid: string = "";
    username: string = "";
    userrole: string = "";
    failed: boolean = false;
    marcadoresView: boolean = false;
    evaluarView: boolean = false;
    resultadosView: boolean = false;
    matchGenView = false;
    matchEditView = false;
    addTeamView = false;
    addGymView = false;
    viewUsersView = false;
    viewTeamsView = false;
    listTeamsView = false;
    listPlayersView = false;

    ddb!: DynamoDb;
    loading = true;

    menuItems: MenuItem[] = [];

    constructor(private fb:FormBuilder, 
                 private authService: AuthService,
                 private router: Router) {

        this.form = this.fb.group({
            scout: ['',Validators.required],
            password: ['',Validators.required]
        });

        if(this.authService.isLoggedIn()){
          let username = this.authService.getUserUsername();
          let pass = this.authService.getUserPass();

          this.authService.getCredentials(username, pass).then(
            (credentials) => {
              if (credentials == undefined) {
                throw Error("AWS Credentials are undefined. Unable to set DDB client")
              }
              DynamoDb.build(credentials).then(
                (client) => {
                  console.log('Iniitation DDB', client)
                  this.ddb = client;
                  this.loading = false;
                });
            }
          )
        }
    }

    ngOnInit(){
      this.reloadLoginStatus()
    }
    
    @ViewChild(ViewTeamsComponent)
    viewTeamsComponent!: ViewTeamsComponent;

    @ViewChild(ListTeamsComponent)
    listTeamsComponent!: ListTeamsComponent;

    reloadLoginStatus() {
      this.isLoggedIn = this.authService.isLoggedIn();
      this.userid = this.authService.getUserId();
      this.username = this.authService.getUserName();
      this.userrole = this.authService.getUserRole();
      console.log("Role: "+this.userrole);
      
      this.isAdmin = false;
      this.isScout = false;
      this.isCoach = false;

      if(this.userrole == "admin"){
        this.isAdmin = true;
        this.isScout = true;
        this.isCoach = true;
      }
      if(this.userrole == "scout"){
        this.isScout = true;
      }
      if(this.userrole == "coach"){
        this.isCoach = true;
      }

      
      if(this.isAdmin){
        this.menuItems = this.menuItems.concat([
          {value: "addGym", text: "Add Gym"},
          {value: "addMatch", text: "Add Match"},
          {value: "editMatch", text: "Edit Match"},
          {value: "listPlayers", text: "Jugadores Registrados"},
          {value: "viewUsers", text: "Usuarios Registrados"}
        ]);
      }
      if(this.isScout){
        this.menuItems = this.menuItems.concat([
          {value: "evaluar", text: " Evaluar Jugador"},
          {value: "resultados", text: "Estadisticas de Evaluacion"},
          {value: "marcadores", text: "Marcadores"}
        ]);
      }
      if(this.isCoach){
        this.menuItems = this.menuItems.concat([
          {value: "listTeams", text: "Equipos Registrados"},
          {value: "addTeam", text: "Registrar Equipo"},          
        ]);
      }

      this.menuItems = this.menuItems.sort((a, b) => a.text.localeCompare(b.text))

      console.log("Reloaded");

      this.changeFeature(this.menuItems[0].value);
    }

    changeFeature(feature: string){
      switch(feature) { 
        case 'evaluar': { 
           this.showEvaluacion()
           break; 
        } 
        case 'marcadores': { 
           this.showMarcadores()
           break; 
        } 
        case 'resultados': { 
           this.showResultados()
           break; 
        } 
        case 'addTeam': { 
           this.showAddTeam()
           break; 
        } 
        case 'addMatch': { 
           this.showMatchGen()
           break; 
        } 
        case 'editMatch': { 
           this.showMatchEdit()
           break; 
        }
        case 'viewUsers': { 
           this.showViewUsers()
           break; 
        } 
        case 'listTeams': { 
           this.showListTeams()
           break; 
        }  
        case 'listPlayers': { 
           this.showListPlayers()
           break; 
        } 
        case 'addGym': { 
           this.showAddGym()
           break; 
        } 
        default: { 
            this.hideAll();
           break; 
        } 
     } 
    }
    
  hideAll(){
    this.marcadoresView = false;
    this.evaluarView = false;
    this.resultadosView = false;
    this.matchGenView = false;
    this.matchEditView = false;
    this.addTeamView = false;
    this.addGymView = false;
    this.viewUsersView = false;
    this.viewTeamsView = false;
    this.listTeamsView = false;
    this.listPlayersView = false;
  }

  showEvaluacion() {
    this.hideAll();
    this.evaluarView = true;
  }
  showMarcadores() {
    this.hideAll();
    this.marcadoresView = true;
  }
  showResultados() {
    this.hideAll();
    this.resultadosView = true;
  }
  showAddTeam(){
    this.hideAll();
    this.addTeamView = true;
  }
  showAddGym(){
    this.hideAll();
    this.addGymView = true;
  }
  showMatchGen(){
    this.hideAll();
    this.matchGenView = true;
  }
  showMatchEdit(){
    this.hideAll();
    this.matchEditView = true;
  }
  showViewUsers(){
    this.hideAll();
    this.viewUsersView = true;
  }
  async showViewTeams(teamId: string){
    this.hideAll();
    this.viewTeamsView = true;
    await this.viewTeamsComponent.loadTeam(teamId);
  }
  showListTeams(){
    this.hideAll();
    this.listTeamsView = true;
  }
  showListPlayers(){
    this.hideAll();
    this.listPlayersView = true;
  }

  async reloadListTeams(){
    this.showListTeams();
    await this.listTeamsComponent.refreshTeams();
  }
}
