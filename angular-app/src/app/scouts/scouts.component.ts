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
      console.log("Reloaded");
    }

    login() {
        const val = this.form.value;

        if (val.scout && val.password) {
            this.authService.login(val.scout, val.password)
                .then(
                    (response) => {
                        if(response != ""){
                          this.authService.setSession(response)
                          console.log("User is logged in");
                        }
                        else{
                          console.log("Failed to log in");
                        }
                    }
                );
        }
    }

    logout() {
      this.authService.logout()
      console.log("User is logged out");
    }
}
