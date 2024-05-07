import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { DynamoDb } from '../aws-clients/dynamodb';
import { Cognito } from '../aws-clients/cognito';

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
  userId: string = "";
  userName: string = "";
  email: string = "";
  failed: boolean = false;
  tokenId: string = "";

    constructor(private fb:FormBuilder, 
                 private authService: AuthService,
                 private router: Router, private activatedRoute: ActivatedRoute) {

        this.form = this.fb.group({
            email: ['',Validators.required],
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
                });
            }
          )
        }
    }

    ngOnInit(){
      this.reloadLoginStatus()
      this.loading = false;

      if(this.isLoggedIn){
        let logout = false;
        this.activatedRoute.queryParams.subscribe(params => {
          logout = params['logout'];
        });
        
        if(logout){
          this.logout()
        }
        else{
          window.location.assign('/#/scouts');
        }
      }
    }
    
    reloadLoginStatus() {
      this.isLoggedIn = this.authService.isLoggedIn();
      this.userId = this.authService.getUserId();
      this.userName = this.authService.getUserName();
      console.log("Reloaded");
    }

    async login() {
      const val = this.form.value;
      this.failed = false;
      this.email = val.email

      if (!(val.email && val.password)) {
        this.failed = true
        return
      }
      
      let user = await this.authService.login(val.email, val.password)
      if (user == undefined) {
        console.log("Failed to log in");
        this.failed = true;
        return
      }

      this.userId = user.id
      this.userName = user.name
      
      this.authService.setSession(val.email, user.id, val.password);
      this.reloadLoginStatus();
      console.log("User is logged in");
      window.location.reload();
    }

    async logout() {
      this.authService.logout();
      window.location.reload();
      this.reloadLoginStatus();
      console.log("User is logged out");
      await this.router.navigateByUrl('/login');
      window.location.reload();
    }
}
