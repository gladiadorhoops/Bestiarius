import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { FormArray } from '@angular/forms';
import { FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

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

    constructor(private fb:FormBuilder, 
                 private authService: AuthService, 
                 private router: Router) {

        this.form = this.fb.group({
            scout: ['',Validators.required],
            password: ['',Validators.required]
        });
    }

    ngOnInit(){
      this.reloadLoginStatus()
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
            let scoutId = this.authService.login(val.scout, val.password)
            scoutId.then(
              (scoutId) => {
                if (scoutId == undefined) {
                  console.log("Failed to log in");
                  this.failed = true;
                } else {
                  this.authService.setSession(val.scout, scoutId);
                  this.reloadLoginStatus();
                  console.log("User is logged in");
                }
              }
            )
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
}
