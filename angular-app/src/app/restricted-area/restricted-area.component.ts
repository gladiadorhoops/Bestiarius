import { Component, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { DynamoDb } from '../aws-clients/dynamodb';
import { ViewTeamsComponent } from './view-teams/view-teams.component';
import { ListTeamsComponent } from './list-teams/list-teams.component';
import { UserBuilder } from '../Builders/user-builder';
import { Role } from '../enum/Role';
import { TOURNAMENT_YEAR } from '../aws-clients/constants';
import { User } from '../interfaces/user';
import { S3 } from '../aws-clients/s3';

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
    registrationYear = false;
    userEntry: User | undefined;
    paramCode: string | undefined;

    ddb!: DynamoDb;
    s3!: S3;
    loading = true;

    menuItems: MenuItem[] = [];
    validationMsg: string = "";

    constructor(private fb:FormBuilder, 
                 private authService: AuthService,
                 private userBuilder: UserBuilder) {

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
              
              S3.build(credentials).then(
                (client) => {
                  console.log('Initiating S3', client)
                  this.s3 = client;
                }
              );
              
              DynamoDb.build(credentials).then(
                (client) => {
                  console.log('Initiating DDB', client)
                  this.ddb = client;
            
                  this.reloadLoginStatus().then( () => this.loading = false)

                }
              );
            }
          )
        }
    }

    async ngOnInit(){
      // read code from cookies and then remove it from cookie
      let cookieCode = localStorage.getItem('code');
      localStorage.removeItem('code');
      if (cookieCode != null){
        this.paramCode = cookieCode
      }
    }
    
    @ViewChild(ViewTeamsComponent)
    viewTeamsComponent!: ViewTeamsComponent;

    @ViewChild(ListTeamsComponent)
    listTeamsComponent!: ListTeamsComponent;

    async reloadLoginStatus() {
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


      let role = this.isAdmin ? Role.ADMIN : (this.isScout ? Role.SCOUT : Role.COACH);
      this.userEntry = await this.userBuilder.getUser(this.ddb, this.userid, role)
      this.registrationYear = this.userEntry!.year! === TOURNAMENT_YEAR

      if(!this.registrationYear && this.paramCode){
        this.validationMsg = await this.userBuilder.tryUpdateUserYear(this.ddb, this.userEntry?.role!, this.userEntry?.id!, this.paramCode)
        if(this.validationMsg === ""){
          this.reloadLoginStatus()
        }
      }

      this.menuItems = this.menuItems.sort((a, b) => a.text.localeCompare(b.text))

      console.log("Reloaded");

      this.changeFeature(this.menuItems[0].value);
    }

    async onRenewRegistration(code: string){
      this.validationMsg = await this.userBuilder.tryUpdateUserYear(this.ddb, this.userEntry?.role!, this.userEntry?.id!, code)
      if(this.validationMsg === ""){
        this.reloadLoginStatus()
      }
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
