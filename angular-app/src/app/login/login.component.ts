import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { DynamoDb } from '../aws-clients/dynamodb';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

    form:FormGroup;
    isLoggedIn: boolean = false;
    ddb!: DynamoDb;
    loading = true;
  scoutid: string = "";
  scoutname: string = "";
  email: string = "";
  failed: boolean = false;

    constructor(private fb:FormBuilder, 
                 private authService: AuthService,
                 private router: Router) {

        this.form = this.fb.group({
            email: ['',Validators.required],
            password: ['',Validators.required]
        });

        if(this.authService.isLoggedIn()){
          let user = this.authService.getScoutName();
          let pass = this.authService.getScoutPass();
          DynamoDb.build(user, pass).then(
            (client) => {
              this.ddb = client;
              this.loading = false;
            });
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
        if (val.email && val.password) {

          DynamoDb.build(val.email, val.password).then(
            (client) => {
              this.ddb = client
              this.authService.login(val.email, val.password,this.ddb).then(
                (scoutId) => {
                  if (scoutId == undefined) {
                    console.log("Failed to log in");
                    this.failed = true;
                  } else {              
                    this.authService.setSession(val.email, scoutId, val.password);
                    this.reloadLoginStatus();
                    console.log("User is logged in");
                    window.location.reload();
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
      window.location.reload();
      this.reloadLoginStatus();
      console.log("User is logged out");
    }
}
