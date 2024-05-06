import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { DynamoDb } from '../aws-clients/dynamodb';

@Component({
  selector: 'app-scouts',
  templateUrl: './scouts.component.html',
  styleUrls: ['./scouts.component.scss']
})
export class ScoutsComponent {
    form:FormGroup;
    isLoggedIn: boolean = false;
    isAdmin = false;
    scoutid: string = "";
    scoutname: string = "";
    failed: boolean = false;
    marcadoresView: boolean = false;
    evaluarView: boolean = false;
    resultadosView: boolean = false;
    matchGenView = false;
    matchEditView = false;
    addTeamView = false;
    ddb!: DynamoDb;
    loading = true;

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
                  this.ddb = client;
                  this.loading = false;
                  this.evaluarView = true;
                });
            }
          )
        }
    }

    ngOnInit(){
      this.reloadLoginStatus()
      this.loading = false;
    }
    
    reloadLoginStatus() {
      this.isLoggedIn = this.authService.isLoggedIn();
      this.scoutid = this.authService.getUserId();
      this.scoutname = this.authService.getUserName();
      if(this.scoutname == 'pecanha'){
        this.isAdmin = true
      }
      else{
        this.isAdmin = false
      }
      console.log("Reloaded");
    }

    changeFeature(feature: string){
      switch(feature) { 
        case 'evaluacion': { 
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
        default: { 
            this.showEvaluacion();
           break; 
        } 
     } 
    }
    
  hideAdd(){
    this.marcadoresView = false;
    this.evaluarView = false;
    this.resultadosView = false;
    this.matchGenView = false;
    this.matchEditView = false;
    this.addTeamView = false;
  }

  showEvaluacion() {
    this.hideAdd();
    this.evaluarView = true;
  }
  showMarcadores() {
    this.hideAdd();
    this.marcadoresView = true;
  }
  showResultados() {
    this.hideAdd();
    this.resultadosView = true;
  }
  showAddTeam(){
    this.hideAdd();
    this.addTeamView = true;
  }
  showMatchGen(){
    this.hideAdd();
    this.matchGenView = true;
  }
  showMatchEdit(){
    this.hideAdd();
    this.matchEditView = true;
  }
}
