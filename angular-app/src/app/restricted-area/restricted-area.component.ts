import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { DynamoDb } from '../aws-clients/dynamodb';

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
    viewUsersView = false;
    viewTeamsView = false;
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
          let user = this.authService.getUserName();
          let pass = this.authService.getUserPass();

          this.authService.getCredentials(user, pass).then(
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
          {value: "addMatch", text: "Add Match"},
          {value: "editMatch", text: "Edit Match"},
          {value: "viewUsers", text: "Usuarios Registrados"}
        ]);
      }
      if(this.isScout){
        this.menuItems = this.menuItems.concat([
          {value: "evaluar", text: "Evaluar"},
          {value: "marcadores", text: "Marcadores"},
          {value: "resultados", text: "Resultados"}
        ]);
      }
      if(this.isCoach){
        this.menuItems = this.menuItems.concat([
          {value: "addTeam", text: "Registrar Equipo"}
        ]);
      }

      // all roles can view teams
      this.menuItems = this.menuItems.concat([
        {value: "viewTeams", text: "Equipos Registrados"}
      ]);

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
        case 'viewTeams': { 
           this.showViewTeams()
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
    this.viewUsersView = false;
    this.viewTeamsView = false;
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
  showViewTeams(){
    this.hideAll();
    this.viewTeamsView = true;
  }
}
