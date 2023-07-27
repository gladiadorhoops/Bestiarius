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
    scoutid: string = "";
    scoutname: string = "";
    failed: boolean = false;
    marcadoresView: boolean = false;
    evaluarView: boolean = false;
    resultadosView: boolean = false;
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
          let user = this.authService.getScoutName();
          let pass = this.authService.getScoutPass();
          DynamoDb.build(user, pass).then(
            (client) => {
              this.ddb = client;
              this.loading = false;
              this.marcadoresView = true;
            });
          this.authService
        }
    }

    ngOnInit(){
      this.reloadLoginStatus()
      this.loading = false;
    }
    
    reloadLoginStatus() {
      this.isLoggedIn = this.authService.isLoggedIn();
      this.scoutid = this.authService.getScoutId();
      this.scoutname = this.authService.getScoutName();
      console.log("Reloaded");
    }

    login() {
        const val = this.form.value;
        this.failed = false;
        if (val.scout && val.password) {

          DynamoDb.build(val.scout, val.password).then(
            (client) => {
              this.ddb = client
              this.authService.login(val.scout, val.password,this.ddb).then(
                (scoutId) => {
                  if (scoutId == undefined) {
                    console.log("Failed to log in");
                    this.failed = true;
                  } else {              
                    this.authService.setSession(val.scout, scoutId, val.password);
                    this.reloadLoginStatus();
                    console.log("User is logged in");
                  }
                }
              )
            }
          )

          let scoutId: string | undefined
        }
        else{
          this.failed = true;
        }
    }

    logout() {
      this.authService.logout();
      this.reloadLoginStatus();
      console.log("User is logged out");
    }
    
  showEvaluacion() {
    this.marcadoresView = false;
    this.evaluarView = true;
    this.resultadosView = false;
  }
  showMarcadores() {
    this.marcadoresView = true;
    this.evaluarView = false;
    this.resultadosView = false;
  }
  showResultados() {
    this.marcadoresView = false;
    this.evaluarView = false;
    this.resultadosView = true;
  }
}
